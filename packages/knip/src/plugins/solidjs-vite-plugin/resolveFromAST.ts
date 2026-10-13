import { type CallExpression, type Expression, type Program, Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import {
  findImportedCalls,
  findProperty,
  getFirstPropertyValue,
  resolveObjectArg,
} from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isFile } from '../../util/fs.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';

const enabler = '@solidjs/vite-plugin';

const entryExtensions = ['tsx', 'jsx', 'ts', 'js', 'mjs', 'tsrx'];

const entryStems: Record<string, string> = {
  entryServer: 'src/entry-server',
  entryClient: 'src/entry-client',
};

const conventions: Record<string, string> = {
  entryServer: `src/entry-server.{${entryExtensions.join(',')}}`,
  entryClient: `src/entry-client.{${entryExtensions.join(',')}}`,
  app: 'src/{App,app}.{tsx,jsx,ts,js,tsrx}',
  document: 'src/Document.{tsx,jsx,tsrx}',
  env: 'env.{ts,js}',
};

export const production = Object.values(conventions);

const startOptions = ['app', 'document', 'entryServer', 'entryClient', 'middleware', 'instrument', 'setup', 'env'];

type Option = { paths: string[]; isDefault: boolean };

const isBoolean = (node: Expression | undefined, value: boolean) => node?.type === 'Literal' && node.value === value;

const getOption = (node: Expression | undefined, isEnv: boolean): Option => {
  if (node?.type === 'ConditionalExpression') {
    const consequent = getOption(node.consequent, isEnv);
    const alternate = getOption(node.alternate, isEnv);
    return {
      paths: [...consequent.paths, ...alternate.paths],
      isDefault: consequent.isDefault || alternate.isDefault,
    };
  }
  const path = getStringValue(node);
  if (path) return { paths: [path], isDefault: false };
  return { paths: [], isDefault: !(isEnv && isBoolean(node, false)) };
};

const hasEntryFile = (root: string, stem: string) => {
  for (const extension of entryExtensions) if (isFile(root, `${stem}.${extension}`)) return true;
  return false;
};

const getConfigObject = (program: Program) => {
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      return decl.type === 'CallExpression' ? resolveObjectArg(decl.arguments[0]) : resolveObjectArg(decl);
    }
  }
};

const hasStaticImport = (program: Program) => {
  for (const node of program.body) {
    if (node.type !== 'ImportDeclaration' || node.importKind === 'type' || node.source.value !== enabler) continue;
    for (const specifier of node.specifiers) {
      if (specifier.type !== 'ImportSpecifier' || specifier.importKind !== 'type') return true;
    }
  }
  return false;
};

const getPluginCalls = (program: Program) => {
  if (hasStaticImport(program)) return findImportedCalls(program, enabler);
  const calls: CallExpression[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      calls.push(node);
    },
  });
  visitor.visit(program);
  return calls;
};

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const root = toAbsolute(getFirstPropertyValue(getConfigObject(program), 'root') ?? '.', options.cwd);
  const patterns = new Set<string>();
  const paths = new Set<string>();

  for (const call of getPluginCalls(program)) {
    const arg = call.arguments[0];
    if (arg?.type !== 'ObjectExpression') continue;

    const configure = getOption(findProperty(findProperty(arg, 'serverFunctions'), 'configure'), false);
    for (const id of configure.paths) paths.add(id);

    const start = findProperty(arg, 'start');
    if (!start || isBoolean(start, false)) continue;

    const startConfig: Record<string, Option> = {};
    for (const name of startOptions) {
      const value = start.type === 'ObjectExpression' ? findProperty(start, name) : undefined;
      startConfig[name] = getOption(value, name === 'env');
    }

    const isAuthored = (name: string) => !startConfig[name].isDefault || hasEntryFile(root, entryStems[name]);
    const ssr = findProperty(arg, 'ssr');
    let hasSpread = false;
    for (const property of arg.properties) if (property.type === 'SpreadElement') hasSpread = true;
    const isClient = !hasSpread && (!ssr || isBoolean(ssr, false));
    const isServer = !hasSpread && isBoolean(ssr, true);
    const skip = new Set<string>();
    if (isClient) {
      skip.add('entryServer');
      skip.add('setup');
      if (isAuthored('entryClient')) skip.add('app');
    } else if (isServer && isAuthored('entryServer') && isAuthored('entryClient')) {
      skip.add('app');
      skip.add('document');
    }

    for (const name of startOptions) {
      if (skip.has(name)) continue;
      const option = startConfig[name];
      for (const id of option.paths) paths.add(id);
      if (option.isDefault && name in conventions) patterns.add(conventions[name]);
    }
  }

  const inputs: Input[] = [];
  for (const pattern of patterns) inputs.push(toProductionEntry(join(root, pattern)));
  for (const id of paths) inputs.push(toProductionEntry(toAbsolute(id, root)));
  return inputs;
};

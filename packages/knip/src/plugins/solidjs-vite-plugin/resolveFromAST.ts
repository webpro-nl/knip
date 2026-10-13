import type { Expression, Program } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import {
  findImportedCalls,
  findProperty,
  getFirstPropertyValue,
  resolveObjectArg,
} from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join, toAbsolute } from '../../util/path.ts';

const conventions: Record<string, string> = {
  entryServer: 'src/entry-server.{tsx,jsx,ts,js,mjs,tsrx}',
  entryClient: 'src/entry-client.{tsx,jsx,ts,js,mjs,tsrx}',
  app: 'src/{App,app}.{tsx,jsx,ts,js,tsrx}',
  document: 'src/Document.{tsx,jsx,tsrx}',
  env: 'env.{ts,js}',
};

export const production = Object.values(conventions);

const startOptions = ['app', 'document', 'entryServer', 'entryClient', 'middleware', 'instrument', 'setup', 'env'];

const isFalse = (node: Expression | undefined) => node?.type === 'Literal' && node.value === false;

const getConfigObject = (program: Program) => {
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      const decl = node.declaration;
      return decl.type === 'CallExpression' ? resolveObjectArg(decl.arguments[0]) : resolveObjectArg(decl);
    }
  }
};

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const root = toAbsolute(getFirstPropertyValue(getConfigObject(program), 'root') ?? '.', options.cwd);
  const patterns = new Set<string>();
  const paths = new Set<string>();

  for (const call of findImportedCalls(program, '@solidjs/vite-plugin')) {
    const arg = call.arguments[0];
    if (arg?.type !== 'ObjectExpression') continue;

    const configure = getStringValue(findProperty(findProperty(arg, 'serverFunctions'), 'configure'));
    if (configure) paths.add(configure);

    const start = findProperty(arg, 'start');
    if (!start || isFalse(start)) continue;

    for (const name of startOptions) {
      const value = start.type === 'ObjectExpression' ? findProperty(start, name) : undefined;
      const path = getStringValue(value);
      if (path) paths.add(path);
      else if (name in conventions && !(name === 'env' && isFalse(value))) patterns.add(conventions[name]);
    }
  }

  const inputs: Input[] = [];
  for (const pattern of patterns) inputs.push(toProductionEntry(join(root, pattern)));
  for (const id of paths) inputs.push(toProductionEntry(toAbsolute(id, root)));
  return inputs;
};

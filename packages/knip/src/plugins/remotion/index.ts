import { type Expression, type MemberExpression, type Program, Visitor } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toDependency, toEntry, toEntryPath } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://www.remotion.dev/docs/config
// https://github.com/remotion-dev/remotion/blob/19e4da7c86fa1140eabb452fefe37cd0d803ad86/packages/cli/src/get-config-file-name.ts#L16-L116
// https://github.com/remotion-dev/remotion/blob/19e4da7c86fa1140eabb452fefe37cd0d803ad86/packages/cli/src/entry-point.ts#L8-L21
// https://github.com/remotion-dev/remotion/blob/19e4da7c86fa1140eabb452fefe37cd0d803ad86/packages/cli/src/index.ts#L114-L203

const title = 'Remotion';

const enablers = ['remotion', '@remotion/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['remotion.config.{ts,js}'];

const production = ['remotion/index.{ts,tsx,js,mjs}', 'src/remotion/index.{ts,tsx,js,mjs}'];

const configPackages = new Set(['@remotion/cli/config', 'remotion']);

const entryCommands = new Set(['studio', 'preview', 'bundle', 'render', 'still', 'compositions', 'benchmark']);

const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');

const args: Args = {
  config: ['config'],
  boolean: true,
  string: [
    'codec',
    'concurrency',
    'crf',
    'env-file',
    'frame',
    'frames',
    'gl',
    'image-format',
    'log',
    'out-dir',
    'pixel-format',
    'port',
    'props',
    'public-dir',
    'scale',
  ],
  resolveInputs: (parsed, { cwd }) => {
    const [command, second, third, fourth] = parsed._;
    if (typeof command !== 'string') return [];

    if (command === 'lambda') {
      const inputs: Input[] = [toDependency('@remotion/lambda')];
      if (second === 'sites' && third === 'create' && typeof fourth === 'string' && !isHttpUrl(fourth)) {
        inputs.push(toEntryPath(fourth, { dir: cwd, optional: true, production: true }));
      }
      return inputs;
    }

    if (command === 'cloudrun') {
      return [toDependency('@remotion/cloudrun')];
    }

    if (entryCommands.has(command) && typeof second === 'string' && !isHttpUrl(second)) {
      return [toEntryPath(second, { dir: cwd, optional: true, production: true })];
    }

    return [];
  },
};

const getMemberPropertyName = (node: MemberExpression): string | undefined => {
  if (!node.computed && node.property.type === 'Identifier') return node.property.name;
  return getStringValue(node.property);
};

const collectConfigBindings = (program: Program) => {
  const configNames = new Set<string>();
  const namespaceNames = new Set<string>();

  for (const stmt of program.body) {
    if (stmt.type === 'ImportDeclaration') {
      const source = getStringValue(stmt.source);
      if (!source || !configPackages.has(source)) continue;
      for (const spec of stmt.specifiers) {
        if (spec.type === 'ImportSpecifier') {
          const imported = spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value;
          if (imported === 'Config') configNames.add(spec.local.name);
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          namespaceNames.add(spec.local.name);
        }
      }
    } else if (stmt.type === 'VariableDeclaration') {
      for (const decl of stmt.declarations) {
        const init = decl.init;
        if (
          !init ||
          init.type !== 'CallExpression' ||
          init.callee.type !== 'Identifier' ||
          init.callee.name !== 'require'
        ) {
          continue;
        }
        const firstArg = init.arguments[0];
        const source = firstArg ? getStringValue(firstArg) : undefined;
        if (!source || !configPackages.has(source)) continue;
        if (decl.id.type === 'Identifier') {
          namespaceNames.add(decl.id.name);
        } else if (decl.id.type === 'ObjectPattern') {
          for (const prop of decl.id.properties) {
            if (prop.type !== 'Property' || prop.value.type !== 'Identifier') continue;
            const key = prop.key.type === 'Identifier' ? prop.key.name : getStringValue(prop.key);
            if (key === 'Config') configNames.add(prop.value.name);
          }
        }
      }
    }
  }

  return { configNames, namespaceNames };
};

const isConfigObject = (node: Expression, configNames: Set<string>, namespaceNames: Set<string>): boolean => {
  if (node.type === 'Identifier') return configNames.has(node.name);
  if (node.type !== 'MemberExpression') return false;
  const propName = getMemberPropertyName(node);
  if (propName === 'Config' && node.object.type === 'Identifier' && namespaceNames.has(node.object.name)) {
    return true;
  }
  if (propName === 'Bundling') {
    return isConfigObject(node.object, configNames, namespaceNames);
  }
  return false;
};

const resolveFromAST: ResolveFromAST = (program, { cwd }) => {
  const { configNames, namespaceNames } = collectConfigBindings(program);
  const entryPoints = new Set<string>();

  if (configNames.size > 0 || namespaceNames.size > 0) {
    const visitor = new Visitor({
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression') return;
        if (getMemberPropertyName(callee) !== 'setEntryPoint') return;
        if (!isConfigObject(callee.object, configNames, namespaceNames)) return;
        const firstArg = node.arguments[0];
        const entry = firstArg ? getStringValue(firstArg) : undefined;
        if (entry) entryPoints.add(entry);
      },
    });
    visitor.visit(program);
  }

  if (entryPoints.size > 0) {
    const inputs: Input[] = [];
    for (const entry of entryPoints) inputs.push(toEntryPath(entry, { dir: cwd, production: true }));
    return inputs;
  }

  return production.map(pattern => toEntry(pattern, { production: true }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  args,
  resolveFromAST,
};

export default plugin;

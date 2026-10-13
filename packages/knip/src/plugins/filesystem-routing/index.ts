import { type CallExpression, Visitor } from 'oxc-parser';
import { escapePath } from 'tinyglobby';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import { join, relative, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getViteRoot } from '../vite/helpers.ts';

// https://github.com/solidjs/filesystem-routing
// https://github.com/solidjs/filesystem-routing/blob/90a19eeb5c58becb0b5d599527c99452eab6f1c5/src/vite/index.ts

const title = 'filesystem-routing';

const enablers = ['filesystem-routing'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const defaultDir = 'src/routes';
const defaultExtensions = ['js', 'jsx', 'ts', 'tsx', 'tsrx'];

const production = [`${defaultDir}/**/*.{${defaultExtensions.join(',')}}`];

const resolveFromAST: ResolveFromAST = (program, { config, cwd }) => {
  if (config.entry) return [];
  const names = new Set<string>();
  const namespaces = new Set<string>();
  const root = getViteRoot(program, cwd);

  for (const node of program.body) {
    if (node.type === 'ImportDeclaration' && node.source.value === 'filesystem-routing/vite') {
      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportNamespaceSpecifier') namespaces.add(specifier.local.name);
        else if (specifier.type === 'ImportSpecifier') {
          const name =
            specifier.imported.type === 'Identifier' ? specifier.imported.name : getStringValue(specifier.imported);
          if (name === 'fileRoutes') names.add(specifier.local.name);
        }
      }
    }
  }

  const calls: CallExpression[] = [];
  const visitor = new Visitor({
    CallExpression(node) {
      const callee = node.callee;
      if (
        (callee.type === 'Identifier' && names.has(callee.name)) ||
        (callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          namespaces.has(callee.object.name) &&
          !callee.computed &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'fileRoutes')
      )
        calls.push(node);
    },
  });
  visitor.visit(program);
  const toEntry = (dir: string, pattern: string) =>
    toProductionEntry(join(cwd, escapePath(relative(cwd, dir)), pattern));
  if (calls.length === 0) return production.map(pattern => toEntry(root, pattern));

  const inputs: Input[] = [];
  for (const call of calls) {
    const options = call.arguments[0];
    const dir = getStringValue(findProperty(options, 'dir')) ?? defaultDir;
    const value = findProperty(options, 'extensions');
    const extensions = new Set<string>();
    let useDefaults = value?.type !== 'ArrayExpression';
    if (value?.type === 'ArrayExpression') {
      for (const element of value.elements) {
        const extension = getStringValue(element);
        if (extension === undefined) useDefaults = true;
        else extensions.add(extension);
      }
    }
    if (useDefaults) for (const extension of defaultExtensions) extensions.add(extension);
    if (extensions.size === 0) continue;
    const suffix = extensions.size === 1 ? [...extensions][0] : `{${[...extensions].join(',')}}`;
    inputs.push(toEntry(toAbsolute(dir, root), `**/*.${suffix}`));
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveFromAST,
};

export default plugin;

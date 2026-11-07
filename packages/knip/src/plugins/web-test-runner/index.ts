import type { Program } from 'oxc-parser';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues, resolveObjectArg } from '../../typescript/ast-helpers.ts';
import { type Input, toEntry } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
// https://github.com/modernweb-dev/web/blob/ed64db24393a49fadf078829b0b34d3ffcaca7e1/packages/test-runner/src/config/readFileConfig.ts
// https://github.com/modernweb-dev/web/blob/ed64db24393a49fadf078829b0b34d3ffcaca7e1/packages/config-loader/src/index.js

const title = 'Web Test Runner';

const enablers = ['@web/test-runner'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['web-test-runner.config.{js,cjs,mjs}'];

const toFileEntries = (ids: Iterable<string>, base: string): Input[] =>
  Array.from(ids, id => {
    const pattern = String(id);
    return toEntry(pattern.startsWith('!') ? `!${toAbsolute(pattern.slice(1), base)}` : toAbsolute(pattern, base));
  });

const getConfigObject = (program: Program) => {
  const body: any[] = (program as unknown as { body: any[] }).body ?? [];
  const bindings = new Map<string, any>();
  for (const node of body) {
    if (node.type !== 'VariableDeclaration') continue;
    for (const declaration of node.declarations) {
      if (declaration.id?.type === 'Identifier' && declaration.init)
        bindings.set(declaration.id.name, declaration.init);
    }
  }
  const dereference = (node: any) => {
    const seen = new Set<string>();
    while (node?.type === 'Identifier' && bindings.has(node.name) && !seen.has(node.name)) {
      seen.add(node.name);
      node = bindings.get(node.name);
    }
    return node;
  };
  for (const node of body) {
    if (node.type === 'ExportDefaultDeclaration') return resolveObjectArg(dereference(node.declaration));
    const { expression } = node;
    if (
      node.type === 'ExpressionStatement' &&
      expression?.type === 'AssignmentExpression' &&
      expression.left?.type === 'MemberExpression' &&
      expression.left.object?.name === 'module' &&
      expression.left.property?.name === 'exports'
    ) {
      return resolveObjectArg(dereference(expression.right));
    }
  }
};

const resolveFromAST: ResolveFromAST = (program, options) => {
  const localConfig = getConfigObject(program);
  const patterns = new Set<string>();
  for (const pattern of getPropertyValues(localConfig, 'files')) patterns.add(pattern);
  const groups = findProperty(localConfig, 'groups');
  if (groups?.type === 'ArrayExpression') {
    for (const group of groups.elements ?? [])
      for (const pattern of getPropertyValues(group, 'files')) patterns.add(pattern);
  }
  return toFileEntries(patterns, options.cwd);
};

const args: Args = {
  binaries: ['web-test-runner', 'wtr'],
  config: ['config'],
  string: ['files'],
  boolean: [
    'coverage',
    'debug',
    'help',
    'manual',
    'node-resolve',
    'open',
    'playwright',
    'preserve-symlinks',
    'puppeteer',
    'static-logging',
    'update-snapshots',
    'watch',
  ],
  resolveInputs: (parsed, { cwd }) =>
    toFileEntries([...parsed._, ...(parsed['--'] ?? []), ...[parsed.files ?? []].flat()].map(String), cwd),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveFromAST,
  args,
};

export default plugin;

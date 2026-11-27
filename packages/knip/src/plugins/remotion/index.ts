import { Visitor } from 'oxc-parser';
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

const entryCommands = new Set(['studio', 'preview', 'bundle', 'render', 'still', 'compositions', 'benchmark']);

const args: Args = {
  config: ['config'],
  resolveInputs: (parsed, { cwd }) => {
    const [command, second, third, fourth] = parsed._;
    if (typeof command !== 'string') return [];

    if (command === 'lambda') {
      const inputs: Input[] = [toDependency('@remotion/lambda')];
      if (second === 'sites' && third === 'create' && typeof fourth === 'string') {
        inputs.push(toEntryPath(fourth, { dir: cwd, optional: true, production: true }));
      }
      return inputs;
    }

    if (command === 'cloudrun') {
      return [toDependency('@remotion/cloudrun')];
    }

    if (entryCommands.has(command) && typeof second === 'string') {
      return [toEntryPath(second, { dir: cwd, optional: true, production: true })];
    }

    return [];
  },
};

const resolveFromAST: ResolveFromAST = (program, { cwd }) => {
  const entryPoints = new Set<string>();
  const visitor = new Visitor({
    CallExpression(node) {
      const { callee } = node;
      if (callee.type !== 'MemberExpression' || callee.computed || callee.property.name !== 'setEntryPoint') return;
      const entry = getStringValue(node.arguments[0]);
      if (entry) entryPoints.add(entry);
    },
  });
  visitor.visit(program);
  if (entryPoints.size === 0) return production.map(pattern => toEntry(pattern, { production: true }));
  return Array.from(entryPoints, entry => toEntryPath(entry, { dir: cwd, production: true }));
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

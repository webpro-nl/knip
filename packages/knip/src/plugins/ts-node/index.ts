import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import type { TsConfigJson } from '../../types/tsconfig-json.ts';
import { type Input, toDependency, toModule } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://typestrong.org/ts-node/docs/options
// https://github.com/TypeStrong/ts-node/blob/v10.9.2/src/configuration.ts#L235-L272
// https://github.com/TypeStrong/ts-node/blob/v10.9.2/src/transpilers/swc.ts#L34-L46

const title = 'ts-node';

const enablers = ['ts-node'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const resolveTsNodeConfig = (options: NonNullable<TsConfigJson['ts-node']>) => {
  const inputs: Input[] = [];

  for (const id of options.require ?? []) inputs.push(toModule(id));

  if (options.compiler) inputs.push(toModule(options.compiler));

  const transpiler = Array.isArray(options.transpiler) ? options.transpiler[0] : options.transpiler;
  if (transpiler) inputs.push(toModule(transpiler));

  if (options.swc) {
    inputs.push(toDependency('@swc/core', { optional: true }));
    inputs.push(toDependency('@swc/wasm', { optional: true }));
  }

  return inputs;
};

const args = {
  binaries: ['ts-node', 'ts-node-cwd', 'ts-node-esm', 'ts-node-script', 'ts-node-transpile-only'],
  positional: (parsed: ParsedArgs) => (parsed.eval === undefined ? parsed._.slice(0, 1) : []),
  nodeImportArgs: true,
  string: [
    'compiler',
    'compilerOptions',
    'cwd',
    'dir',
    'eval',
    'experimentalSpecifierResolution',
    'ignore',
    'ignoreDiagnostics',
    'project',
    'scopeDir',
    'transpiler',
  ],
  alias: {
    compiler: ['C'],
    compilerOptions: ['O', 'compiler-options'],
    eval: ['e'],
    ignore: ['I'],
    ignoreDiagnostics: ['D', 'ignore-diagnostics'],
    project: ['P'],
  },
  boolean: true,
  stopEarly: true,
} satisfies Args;

const note = 'The `"ts-node"` section of `tsconfig.json` is read by the TypeScript plugin.';

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  args,
};

export default plugin;

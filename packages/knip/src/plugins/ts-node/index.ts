import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import type { TsConfigJson } from '../../types/tsconfig-json.ts';
import { type Input, toDeferResolve, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://typestrong.org/ts-node/docs/options
// https://github.com/TypeStrong/ts-node/blob/v10.9.2/src/configuration.ts#L235-L272
// https://github.com/TypeStrong/ts-node/blob/v10.9.2/src/transpilers/swc.ts#L34-L46

const title = 'ts-node';

const enablers = ['ts-node'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const resolveTsNodeConfig = (options: NonNullable<TsConfigJson['ts-node']>) => {
  const inputs: Input[] = [];

  for (const id of options.require ?? []) inputs.push(toDeferResolve(id));

  if (options.compiler) inputs.push(toDeferResolve(options.compiler));

  const transpiler = Array.isArray(options.transpiler) ? options.transpiler[0] : options.transpiler;
  if (transpiler) inputs.push(toDeferResolve(transpiler));

  if (options.swc) {
    inputs.push(toDependency('@swc/core', { optional: true }));
    inputs.push(toDependency('@swc/wasm', { optional: true }));
  }

  return inputs;
};

const args = {
  positional: true,
  nodeImportArgs: true,
  boolean: ['transpileOnly', 'compilerHost', 'ignoreDiagnostics', 'swc', 'preferTsExts'],
  alias: {
    transpileOnly: ['T', 'transpile-only'],
    compilerHost: ['H', 'compiler-host'],
    ignoreDiagnostics: ['D'],
    preferTsExts: ['prefer-ts-exts'],
  },
};

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

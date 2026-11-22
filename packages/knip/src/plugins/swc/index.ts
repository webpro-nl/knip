import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { type Input, toModule, toDependency } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { SWCConfig } from './types.ts';

// https://swc.rs/
// https://swc.rs/docs/configuration/swcrc
// https://github.com/swc-project/swc/blob/v1.16.21/crates/swc/src/config/mod.rs#L1115-L1122

const title = 'SWC';

const enablers = ['@swc/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.swcrc'];

const resolveConfig: ResolveConfig<SWCConfig | SWCConfig[]> = async (config, options) => {
  const plugins: string[] = [];
  const inputs: Input[] = [];
  for (const item of [config].flat()) {
    for (const [id] of item?.jsc?.experimental?.plugins ?? []) plugins.push(id);
    if (item?.jsc?.externalHelpers) inputs.push(toDependency('@swc/helpers', { production: true }));
  }
  for (const id of compact(plugins))
    inputs.push(isInternal(id) ? toModule(id, { dir: options.cwd }) : toDependency(id));
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

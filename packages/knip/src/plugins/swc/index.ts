import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { SWCConfig } from './types.ts';

// https://swc.rs/
// https://swc.rs/docs/configuration/swcrc
// https://github.com/swc-project/swc/blob/v1.16.21/crates/swc/src/config/mod.rs#L1115-L1122

const title = 'SWC';

const enablers = ['@swc/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.swcrc'];

const resolveConfig: ResolveConfig<SWCConfig | SWCConfig[]> = async config => {
  const dependencies: string[] = [];
  for (const item of [config].flat()) {
    for (const [id] of item?.jsc?.experimental?.plugins ?? []) dependencies.push(id);
    if (item?.jsc?.externalHelpers) dependencies.push('@swc/helpers');
  }
  return compact(dependencies).map(id => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

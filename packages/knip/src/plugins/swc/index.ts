import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { SWCConfig } from './types.ts';

// https://swc.rs/
// https://swc.rs/docs/configuration/swcrc

const title = 'SWC';

const enablers = ['@swc/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.swcrc'];

const resolveConfig: ResolveConfig<SWCConfig> = async config => {
  const inputs = config?.jsc?.experimental?.plugins ?? [];
  return inputs.map(([id]) => toDependency(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

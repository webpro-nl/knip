import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { SWCConfig } from './types.js';

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

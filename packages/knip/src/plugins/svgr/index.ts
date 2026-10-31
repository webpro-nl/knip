import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toCosmiconfig } from '../../util/plugin-config.ts';
import type { SvgrConfig } from './types.ts';

// https://react-svgr.com/docs/configuration-files/
// https://github.com/gregberge/svgr/blob/v8.1.0/packages/core/src/config.ts
// https://github.com/cosmiconfig/cosmiconfig/blob/cosmiconfig-v8.3.6/src/index.ts

const title = 'SVGR';

const enablers = ['@svgr/cli', '@svgr/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('svgr')];

const resolveConfig: ResolveConfig<SvgrConfig> = async config => {
  const inputs: Input[] = [];
  if (config.plugins) {
    for (const plugin of config.plugins) {
      if (typeof plugin === 'string') inputs.push(toDependency(plugin));
    }
  }
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

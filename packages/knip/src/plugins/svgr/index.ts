import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { SvgrConfig } from './types.js';

// https://react-svgr.com/docs/configuration-files/

const title = 'SVGR';

const enablers = ['@svgr/cli', '@svgr/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.svgrrc', '.svgrrc.{yaml,yml,json,js}', 'svgr.config.{js,cjs}', 'package.json'];

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

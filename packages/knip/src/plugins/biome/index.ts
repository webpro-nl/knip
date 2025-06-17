import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import { type Input, toConfig } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { BiomeConfig } from './types.js';

const title = 'Biome';

const enablers = ['@biomejs/biome'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['biome.json', 'biome.jsonc'];

const resolveExtends = (extendsArray: string[], options: PluginOptions): Input[] => {
  return extendsArray.map(specifier => toConfig('biome', specifier, { containingFilePath: options.configFilePath }));
};

const resolveConfig: ResolveConfig<BiomeConfig> = (config, options) => {
  return [...resolveExtends(config.extends || [], options)];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

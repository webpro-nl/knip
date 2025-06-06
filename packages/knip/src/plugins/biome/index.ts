import type { IsPluginEnabled, Plugin, PluginOptions, Resolve, ResolveConfig } from '../../types/config.js';
import { type Input, toConfig, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { BiomeConfig } from './types.js';

const title = 'biome';

const enablers = ['@biomejs/biome', 'biome'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => {
  const enabled = hasDependency(dependencies, enablers);
  return enabled;
};

const config: string[] = ['biome.json', 'biome.jsonc'];

const resolveExtends = (extendsArray: string[], options: PluginOptions): Input[] => {
  return extendsArray.map(specifier => {
    if (specifier.endsWith('.json') || specifier.endsWith('.jsonc')) {
      return toConfig('biome', specifier);
    }
    return toConfig('biome', specifier, { containingFilePath: options.configFilePath });
  });
};

const resolveConfig: ResolveConfig<BiomeConfig> = (config, options) => {
  return [...resolveExtends(config.extends || [], options)];
};

const resolve: Resolve = options => {
  const { manifest } = options;
  const inputs: Input[] = [];
  if (Object.values(manifest.scripts || {}).some(script => script.includes('biome'))) {
    inputs.push(toDependency('@biomejs/biome'));
  }
  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolve,
} satisfies Plugin;

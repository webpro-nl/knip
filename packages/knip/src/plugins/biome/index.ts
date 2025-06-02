import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import { type Input, toConfig, toDeferResolve, toDependency, toIgnore } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { BiomeConfig } from './types.js';

const title = 'biome';

const enablers = ['@biomejs/biome'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => {
  const enabled = hasDependency(dependencies, enablers);
  return enabled;
};

const config: string[] = ['biome.json', 'biome.jsonc'];

const resolveExtends = (extendsArray: string[], options: PluginOptions): Input[] => {
  const inputs = [] as Input[];
  for (const item of extendsArray) {
    // https://biomejs.dev/guides/configure-biome/#share-a-configuration-file
    if (item.endsWith('.json') || item.endsWith('.jsonc')) {
      inputs.push(toConfig('biome', item));
    } else {
      if (require.resolve(item, { paths: [options.cwd] })) {
        inputs.push(toDependency(item));
      }
    }
  }
  return inputs;
};

const resolveConfig: ResolveConfig<BiomeConfig> = (config, options) => {
  return [
    // If we're using biome plugin, biome should be ignored in the report
    toIgnore('@biomejs/biome', 'dependencies'),
    ...resolveExtends(config.extends || [], options),
  ];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

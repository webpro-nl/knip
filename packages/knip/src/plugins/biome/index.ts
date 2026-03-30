import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.ts';
import { arrayify } from '../../util/array.ts';
import { type Input, toConfig } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { BiomeConfig } from './types.ts';

const title = 'Biome';

const enablers = ['@biomejs/biome'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['biome.json', 'biome.jsonc'];

const isRootConfigReference = (specifier: string) => specifier === '//';

const resolveExtends = (extendsArray: string[], options: PluginOptions): Input[] => {
  return extendsArray.map(specifier => {
    if (isRootConfigReference(specifier)) {
      return toConfig('biome', join(options.rootCwd, 'biome'), { containingFilePath: options.configFilePath });
    }

    return toConfig('biome', specifier, { containingFilePath: options.configFilePath });
  });
};

const resolveConfig: ResolveConfig<BiomeConfig> = (config, options) => {
  return [...resolveExtends(arrayify(config.extends), options)];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

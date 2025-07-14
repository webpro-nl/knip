import type { IsPluginEnabled, Plugin, PluginOptions, ResolveConfig } from '../../types/config.js';
import { arrayify } from '../../util/array.js';
import { type Input, toConfig } from '../../util/input.js';
import { extname, join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { _createSyncResolver } from '../../util/resolve.js';
import type { BiomeConfig } from './types.js';

const title = 'Biome';

const enablers = ['@biomejs/biome'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['biome.json', 'biome.jsonc'];
const configExtensions = config.map(configFileName => extname(configFileName));

const resolveRootConfigReference = (specifier: string, baseDir: string) => {
  const resolver = _createSyncResolver(configExtensions);
  const resolvedPath = resolver(specifier, baseDir);

  return resolvedPath;
};

const isRootConfigReference = (specifier: string) => specifier === '//';

const resolveExtends = (extendsArray: string[], options: PluginOptions): Input[] => {
  return extendsArray.map(specifier => {
    if (isRootConfigReference(specifier)) {
      const resolvedSpecifier = resolveRootConfigReference(join(options.rootCwd, 'biome'), options.rootCwd);
      return toConfig('biome', resolvedSpecifier ?? specifier, { containingFilePath: options.configFilePath });
    }
    return toConfig('biome', specifier, { containingFilePath: options.configFilePath });
  });
};

const resolveConfig: ResolveConfig<BiomeConfig> = (config, options) => {
  return [...resolveExtends(arrayify(config.extends || []), options)];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

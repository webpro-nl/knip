import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PostCSSConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

const NAME = 'PostCSS';

const ENABLERS = ['postcss', 'next'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['postcss.config.{cjs,js}', 'postcss.config.json', 'package.json'];

const findPostCSSDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: PostCSSConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest?.postcss : await load(configFilePath);

  if (!localConfig) return [];

  return localConfig.plugins
    ? (Array.isArray(localConfig.plugins) ? localConfig.plugins : Object.keys(localConfig.plugins)).flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
    : [];
};

const findDependencies = timerify(findPostCSSDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

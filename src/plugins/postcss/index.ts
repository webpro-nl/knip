import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PostCSSConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'PostCSS';

/** @public */
export const ENABLERS = ['postcss', 'next'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['postcss.config.js', 'postcss.config.json', 'package.json'];

const findPostCSSDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const config: PostCSSConfig = configFilePath.endsWith('package.json')
    ? manifest?.postcss
    : await load(configFilePath);

  if (!config) return [];

  return config.plugins
    ? (Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins)).flatMap(plugin => {
        if (typeof plugin === 'string') return plugin;
        if (Array.isArray(plugin) && typeof plugin[0] === 'string') return plugin[0];
        return [];
      })
    : [];
};

export const findDependencies = timerify(findPostCSSDependencies);

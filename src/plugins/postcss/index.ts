import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { PostCSSConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

export const NAME = 'PostCSS';

/** @public */
export const ENABLERS = ['postcss'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['postcss.config.js', 'package.json'];

const findPostCSSDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  const config: PostCSSConfig = configFilePath.endsWith('package.json')
    ? manifest?.postcss
    : await _load(configFilePath);

  return config?.plugins
    ? (Array.isArray(config.plugins) ? config.plugins : Object.keys(config.plugins)).filter(
        plugin => typeof plugin === 'string'
      )
    : [];
};

export const findDependencies = timerify(findPostCSSDependencies);

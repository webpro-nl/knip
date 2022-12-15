import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { Configuration } from 'webpack';

// https://webpack.js.org/configuration/

export const CONFIG_FILE_PATTERNS = ['webpack.config*.js'];

export const ENTRY_FILE_PATTERNS = ['webpack.config*.js'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('webpack');

const findWebpackDependencies: GenericPluginCallback = async configFilePath => {
  const config: Configuration = await _load(configFilePath);

  const loaders = (
    config.module?.rules?.flatMap(rule => {
      if (!rule || typeof rule === 'string') return [];
      if (typeof rule.use === 'string') return [rule.use];
      if (Array.isArray(rule.use)) {
        return rule.use.flatMap(use => {
          if (!use) return [];
          if (typeof use === 'string') return [use];
          if ('loader' in use && typeof use.loader === 'string') return [use.loader];
          return [];
        });
      }
      return [];
    }) ?? []
  )
    .map(loader => loader.replace(/\?.*/, ''))
    .filter(loader => !loader.startsWith('/'));

  return compact([...loaders]);
};

export const findDependencies = timerify(findWebpackDependencies);

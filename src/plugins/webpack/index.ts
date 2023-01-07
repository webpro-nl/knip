import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { BabelConfig } from '../babel/types.js';
import type { WebpackConfig } from './types.js';
import type { RuleSetRule, RuleSetUseItem } from 'webpack';

// https://webpack.js.org/configuration/

export const NAME = 'Webpack';

/** @public */
export const ENABLERS = ['webpack'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['webpack.config*.{js,ts}'];

const hasBabelOptions = (use: RuleSetUseItem) =>
  Boolean(use) &&
  typeof use !== 'string' &&
  'loader' in use &&
  typeof use.loader === 'string' &&
  use.loader === 'babel-loader' &&
  typeof use.options === 'object';

const resolveRuleSetDependencies = (rule: RuleSetRule | '...') => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  if (!rule.use || typeof rule.use === 'function') return [];
  return [rule.use].flat().flatMap((use: RuleSetUseItem) => {
    if (hasBabelOptions(use)) {
      return [...resolveUseItemLoader(use), ...getDependenciesFromConfig((use as { options: BabelConfig }).options)];
    }
    return resolveUseItemLoader(use);
  });
};

const resolveUseItemLoader = (use: RuleSetUseItem) => {
  if (!use) return [];
  if (typeof use === 'string') return [use];
  if ('loader' in use && typeof use.loader === 'string') return [use.loader];
  return [];
};

const findWebpackDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  let config: WebpackConfig = await _load(configFilePath);

  if (typeof config === 'function') {
    config = config({ production: isProduction }, { mode: isProduction ? 'production' : 'development' });
  }

  const dependencies = [config].flat().flatMap(config => {
    return (config.module?.rules?.flatMap(resolveRuleSetDependencies) ?? [])
      .map(loader => loader.replace(/\?.*/, ''))
      .filter(loader => !loader.startsWith('/'));
  });

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script?.includes('webpack ')) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...dependencies, ...webpackCLI, ...webpackDevServer]);
};

export const findDependencies = timerify(findWebpackDependencies);

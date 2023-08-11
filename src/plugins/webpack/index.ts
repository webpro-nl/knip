import { compact } from '../../util/array.js';
import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { WebpackConfig, Env, Argv } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { BabelConfigObj } from '../babel/types.js';
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

const info = { compiler: '', issuer: '', realResource: '', resource: '', resourceQuery: '' };

const resolveRuleSetDependencies = (rule: RuleSetRule | undefined | null | false | 0 | '...' | '') => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  let useItem = rule.use ?? rule.loader ?? rule;
  if (typeof useItem === 'function') useItem = useItem(info);
  return [useItem].flat().flatMap((useItem: RuleSetUseItem | undefined | null | false | 0) => {
    if (!useItem) return [];
    if (hasBabelOptions(useItem)) {
      return [
        ...resolveUseItem(useItem),
        ...getDependenciesFromConfig((useItem as { options: BabelConfigObj }).options),
      ];
    }
    return resolveUseItem(useItem);
  });
};

const resolveUseItem = (use: RuleSetUseItem) => {
  if (!use) return [];
  if (typeof use === 'string') return [use];
  if ('loader' in use && typeof use.loader === 'string') return [use.loader];
  return [];
};

const findWebpackDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  const config: WebpackConfig = await load(configFilePath);

  if (!config) return [];

  // Projects may use a single config function for both development and production modes, so resolve it twice
  const passes = typeof config === 'function' ? [false, true] : [isProduction];

  const dependencies = passes.flatMap(isProduction => {
    const env: Env = { production: isProduction };
    const argv: Argv = { mode: isProduction ? 'production' : 'development' };
    const cfg = typeof config === 'function' ? config(env, argv) : config;

    return [cfg].flat().flatMap(config => {
      const dependencies = (config.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []).map(loader =>
        loader.replace(/\?.*/, '')
      );
      const entries: string[] = [];

      if (typeof cfg.entry === 'string') entries.push(cfg.entry);
      else if (Array.isArray(cfg.entry)) entries.push(...cfg.entry);
      else if (typeof cfg.entry === 'object') {
        Object.values(cfg.entry).map(entry => {
          if (typeof entry === 'string') entries.push(entry);
          else if (Array.isArray(entry)) entries.push(...entry);
          else if (typeof entry === 'function') entries.push((entry as () => string)());
          else if (entry && typeof entry === 'object' && 'filename' in entry) entries.push(entry['filename'] as string);
        });
      }

      return [...dependencies, ...entries.map(entry => (config.context ? join(config.context, entry) : entry))];
    });
  });

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script?.includes('webpack ')) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...dependencies, ...webpackCLI, ...webpackDevServer]);
};

export const findDependencies = timerify(findWebpackDependencies);

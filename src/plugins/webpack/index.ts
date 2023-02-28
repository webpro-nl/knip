import path from 'node:path';
import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { isAbsolute } from '../../util/path.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { WebpackConfig, Env, Argv } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { BabelConfig } from '../babel/types.js';
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

const resolveRuleSetDependencies = (rule: RuleSetRule | '...') => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  let useItem = rule.use ?? rule.loader ?? rule;
  if (typeof useItem === 'function') useItem = useItem(info);
  return [useItem].flat().flatMap((useItem: RuleSetUseItem) => {
    if (hasBabelOptions(useItem)) {
      return [...resolveUseItem(useItem), ...getDependenciesFromConfig((useItem as { options: BabelConfig }).options)];
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

const findWebpackDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, isProduction }) => {
  const config: WebpackConfig = await _load(configFilePath);

  if (!config) return [];

  const entryFiles: Set<string> = new Set();

  // Projects may use a single config function for both development and production modes, so resolve it twice
  const passes = typeof config === 'function' ? [false, true] : [isProduction];

  const dependencies = passes.flatMap(isProduction => {
    const env: Env = { production: isProduction };
    const argv: Argv = { mode: isProduction ? 'production' : 'development' };
    const cfg = typeof config === 'function' ? config(env, argv) : config;

    return [cfg].flat().flatMap(config => {
      const dependencies = (config.module?.rules?.flatMap(resolveRuleSetDependencies) ?? [])
        .map(loader => loader.replace(/\?.*/, ''))
        .map(getPackageName);

      if (cfg.entry) {
        const entries =
          typeof cfg.entry === 'string'
            ? [cfg.entry]
            : Array.isArray(cfg.entry)
            ? cfg.entry
            : Object.values(cfg.entry).map(entry => (typeof entry === 'string' ? entry : entry.filename));
        entries.forEach(entry => {
          entryFiles.add(isAbsolute(entry) ? entry : path.join(cwd, entry));
        });
      }

      return dependencies;
    });
  });

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script?.includes('webpack ')) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return {
    dependencies: compact([...dependencies, ...webpackCLI, ...webpackDevServer]),
    entryFiles: Array.from(entryFiles),
  };
};

export const findDependencies = timerify(findWebpackDependencies);

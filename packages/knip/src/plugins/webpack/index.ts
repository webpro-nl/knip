import type { RuleSetRule, RuleSetUseItem } from 'webpack';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { compact } from '#p/util/array.js';
import { isAbsolute, isInternal, join, relative } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '#p/util/protocols.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { BabelConfigObj } from '../babel/types.js';
import type { Argv, Env, WebpackConfig } from './types.js';

// https://webpack.js.org/configuration/

const title = 'Webpack';

const enablers = ['webpack', 'webpack-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['webpack.config*.{js,ts,mjs,cjs,mts,cts}'];

const production: string[] = [];

const hasBabelOptions = (use: RuleSetUseItem) =>
  Boolean(use) &&
  typeof use !== 'string' &&
  'loader' in use &&
  typeof use.loader === 'string' &&
  use.loader === 'babel-loader' &&
  typeof use.options === 'object';

const info = { compiler: '', issuer: '', realResource: '', resource: '', resourceQuery: '' };

const resolveRuleSetDependencies = (rule: RuleSetRule | undefined | null | false | 0 | '...' | ''): string[] => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  let useItem = rule.use ?? rule.loader ?? rule;
  if (typeof useItem === 'function') useItem = useItem(info);
  if (typeof useItem === 'string' && hasBabelOptions(rule)) {
    return [useItem, ...getDependenciesFromConfig((rule as { options: BabelConfigObj }).options)];
  }
  return [useItem].flat().flatMap((item: RuleSetRule | RuleSetUseItem | undefined | null | false | 0) => {
    if (!item) return [];
    if (hasBabelOptions(item)) {
      return [...resolveUseItem(item), ...getDependenciesFromConfig((item as { options: BabelConfigObj }).options)];
    }
    if (typeof item !== 'string' && 'oneOf' in item) return item.oneOf?.flatMap(resolveRuleSetDependencies) ?? [];
    return resolveUseItem(item);
  });
};

const resolveUseItem = (use: RuleSetUseItem) => {
  if (!use) return [];
  if (typeof use === 'string') return [use];
  if ('loader' in use && typeof use.loader === 'string') return [use.loader];
  return [];
};

export const findWebpackDependenciesFromConfig = async ({ config, cwd }: { config: WebpackConfig; cwd: string }) => {
  // Projects may use a single config function for both development and production modes, so resolve it twice
  // https://webpack.js.org/configuration/configuration-types/#exporting-a-function
  const passes = typeof config === 'function' ? [false, true] : [false];

  const dependencies = new Set<string>();
  const entryPatterns = new Set<string>();

  for (const isProduction of passes) {
    const env: Env = { production: isProduction };
    const argv: Argv = { mode: isProduction ? 'production' : 'development' };
    const resolvedConfig = typeof config === 'function' ? await config(env, argv) : config;

    for (const options of [resolvedConfig].flat()) {
      const entries = [];

      for (const loader of options.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []) {
        dependencies.add(loader.replace(/\?.*/, ''));
      }

      if (typeof options.entry === 'string') entries.push(options.entry);
      else if (Array.isArray(options.entry)) entries.push(...options.entry);
      else if (typeof options.entry === 'object') {
        for (const entry of Object.values(options.entry)) {
          if (typeof entry === 'string') entries.push(entry);
          else if (Array.isArray(entry)) entries.push(...entry);
          else if (typeof entry === 'function') entries.push((entry as () => string)());
          else if (entry && typeof entry === 'object' && 'filename' in entry) entries.push(entry['filename'] as string);
        }
      }

      for (const entry of entries) {
        if (!isInternal(entry)) {
          dependencies.add(entry);
        } else {
          const absoluteEntry = isAbsolute(entry) ? entry : join(options.context ? options.context : cwd, entry);
          const item = relative(cwd, absoluteEntry);
          const value = options.mode === 'development' ? toEntryPattern(item) : toProductionEntryPattern(item);
          entryPatterns.add(value);
        }
      }
    }
  }

  return { dependencies, entryPatterns };
};

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const { cwd, isProduction, manifest } = options;

  const { entryPatterns, dependencies } = await findWebpackDependenciesFromConfig({ config: localConfig, cwd });

  if (isProduction) return [...entryPatterns];

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script && /(?<=^|\s)webpack(?=\s|$)/.test(script)) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...entryPatterns, ...dependencies, ...webpackCLI, ...webpackDevServer]);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
} satisfies Plugin;

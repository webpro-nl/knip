import type { ResolveOptions, RuleSetRule, RuleSetUseItem } from 'webpack';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import {
  type Input,
  toAlias,
  toDeferResolve,
  toDeferResolveEntry,
  toDeferResolveProductionEntry,
  toDependency,
} from '../../util/input.js';
import { isInternal, join, toAbsolute } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { BabelConfigObj } from '../babel/types.js';
import type { Argv, Env, ProvidePlugin, WebpackConfig } from './types.js';

// https://webpack.js.org/configuration/

const title = 'webpack';

const enablers = ['webpack', 'webpack-cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['webpack.config.{js,ts,mjs,cjs,mts,cts}'];

const hasBabelOptions = (use: RuleSetUseItem) =>
  Boolean(use) &&
  typeof use !== 'string' &&
  'loader' in use &&
  typeof use.loader === 'string' &&
  use.loader === 'babel-loader' &&
  typeof use.options === 'object';

const info = {
  compiler: '',
  issuer: '',
  realResource: '',
  resource: '',
  resourceQuery: '',
  dependency: '',
  descriptionData: {},
  issuerLayer: '',
};

const resolveRuleSetDependencies = (rule: RuleSetRule | undefined | null | false | 0 | '...' | ''): string[] => {
  if (!rule || typeof rule === 'string') return [];
  if (typeof rule.use === 'string') return [rule.use];
  let useItem = rule.use ?? rule.loader ?? rule;
  if (typeof useItem === 'function') useItem = useItem(info);
  if (typeof useItem === 'string' && hasBabelOptions(rule)) {
    const d = getDependenciesFromConfig((rule as { options: BabelConfigObj }).options).map(d => d.specifier);
    return [useItem, ...d];
  }
  return [useItem].flat().flatMap((item: RuleSetRule | RuleSetUseItem | undefined | null | false | 0) => {
    if (!item) return [];
    if (hasBabelOptions(item)) {
      const d = getDependenciesFromConfig((item as { options: BabelConfigObj }).options).map(d => d.specifier);
      return [...resolveUseItem(item), ...d];
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

export const findWebpackDependenciesFromConfig: ResolveConfig<WebpackConfig> = async (config, options) => {
  const { cwd, isProduction } = options;

  // Projects may use a single config function for both development and production modes, so resolve it twice
  // https://webpack.js.org/configuration/configuration-types/#exporting-a-function
  const passes = typeof config === 'function' ? [false, true] : [isProduction];

  const inputs = new Set<Input>();

  for (const isProduction of passes) {
    const mode = isProduction ? 'production' : 'development';
    const env: Env = { production: isProduction, mode };
    const argv: Argv = { mode };
    const resolvedConfig = typeof config === 'function' ? await config(env, argv) : config;

    for (const opts of [resolvedConfig].flat()) {
      const entries = [];

      for (const loader of opts.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []) {
        inputs.add(toDeferResolve(loader.replace(/\?.*/, '')));
      }

      for (const plugin of opts?.plugins ?? []) {
        if (plugin && plugin.constructor.name === 'ProvidePlugin') {
          const providePluginInstance = plugin as ProvidePlugin;
          if (providePluginInstance.definitions) {
            for (const values of Object.values(providePluginInstance.definitions)) {
              const specifier = typeof values === 'string' ? values : values[0];
              inputs.add(toDeferResolve(specifier));
            }
          }
        }
      }

      if (typeof opts.entry === 'string') entries.push(opts.entry);
      else if (Array.isArray(opts.entry)) entries.push(...opts.entry);
      else if (typeof opts.entry === 'object') {
        for (const entry of Object.values(opts.entry)) {
          if (typeof entry === 'string') entries.push(entry);
          else if (Array.isArray(entry)) entries.push(...entry);
          else if (typeof entry === 'function') entries.push((entry as () => string)());
          else if (entry && typeof entry === 'object' && 'filename' in entry) entries.push(entry['filename'] as string);
        }
      }

      for (const entry of entries) {
        if (isInternal(entry)) {
          const dir = opts.context ? opts.context : cwd;
          const input = isProduction
            ? toDeferResolveProductionEntry(entry, { dir })
            : toDeferResolveEntry(entry, { dir });
          inputs.add(input);
        } else {
          inputs.add(toDeferResolve(entry));
        }
      }

      const processAlias = (aliases: NonNullable<ResolveOptions['alias']>) => {
        const addStar = (value: string) => (value.endsWith('*') ? value : join(value, '*').replace(/\/\*\*$/, '/*'));
        for (const [alias, value] of Object.entries(aliases)) {
          if (!value) continue;
          const prefixes = Array.isArray(value) ? value : [value];
          if (alias.endsWith('$')) {
            inputs.add(toAlias(alias.slice(0, -1), prefixes));
          } else {
            if (alias.length > 1) inputs.add(toAlias(alias, prefixes));
            for (const prefix of prefixes) {
              inputs.add(toAlias(addStar(alias), [addStar(toAbsolute(prefix, options.configFileDir))]));
            }
          }
        }
      };

      if (opts.resolve?.alias) {
        processAlias(opts.resolve.alias);
      }
      if (opts.resolveLoader?.alias) {
        processAlias(opts.resolveLoader.alias);
      }
    }
  }

  return Array.from(inputs);
};

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const { manifest } = options;

  const inputs = await findWebpackDependenciesFromConfig(localConfig, options);

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script && /(?<=^|\s)webpack(?=\s|$)/.test(script)) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...inputs, ...[...webpackCLI, ...webpackDevServer].map(id => toDependency(id))]);
};

const args = {
  binaries: ['webpack', 'webpack-dev-server'],
  config: true,
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
} satisfies Plugin;

import type { RuleSetRule, RuleSetUseItem } from 'webpack';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import {
  type Input,
  toDeferResolve,
  toDeferResolveEntry,
  toDeferResolveProductionEntry,
  toDependency,
  toDevDependency,
} from '../../util/input.js';
import { isAbsolute, isInternal, join, relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { BabelConfigObj } from '../babel/types.js';
import type { Argv, Env, WebpackConfig } from './types.js';

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

const info = { compiler: '', issuer: '', realResource: '', resource: '', resourceQuery: '' };

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

export const findWebpackDependenciesFromConfig = async ({ config, cwd }: { config: WebpackConfig; cwd: string }) => {
  // Projects may use a single config function for both development and production modes, so resolve it twice
  // https://webpack.js.org/configuration/configuration-types/#exporting-a-function
  const passes = typeof config === 'function' ? [false, true] : [false];

  const inputs = new Set<Input>();

  for (const isProduction of passes) {
    const mode = isProduction ? 'production' : 'development';
    const env: Env = { production: isProduction, mode };
    const argv: Argv = { mode };
    const resolvedConfig = typeof config === 'function' ? await config(env, argv) : config;

    for (const options of [resolvedConfig].flat()) {
      const entries = [];

      for (const loader of options.module?.rules?.flatMap(resolveRuleSetDependencies) ?? []) {
        inputs.add(toDeferResolve(loader.replace(/\?.*/, '')));
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
          inputs.add(toDependency(entry));
        } else {
          const absoluteEntry = isAbsolute(entry) ? entry : join(options.context ? options.context : cwd, entry);
          const item = relative(cwd, absoluteEntry);
          const input =
            options.mode === 'development' ? toDeferResolveEntry(item) : toDeferResolveProductionEntry(item);
          inputs.add(input);
        }
      }
    }
  }

  return inputs;
};

const resolveConfig: ResolveConfig<WebpackConfig> = async (localConfig, options) => {
  const { cwd, manifest } = options;

  const inputs = await findWebpackDependenciesFromConfig({ config: localConfig, cwd });

  const scripts = Object.values(manifest.scripts ?? {});
  const webpackCLI = scripts.some(script => script && /(?<=^|\s)webpack(?=\s|$)/.test(script)) ? ['webpack-cli'] : [];
  const webpackDevServer = scripts.some(script => script?.includes('webpack serve')) ? ['webpack-dev-server'] : [];

  return compact([...inputs, [...webpackCLI, ...webpackDevServer].map(toDevDependency)].flat());
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

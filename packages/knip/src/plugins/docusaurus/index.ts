import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import {
  toAlias,
  toDeferResolve,
  toDeferResolveEntry,
  toDependency,
  toIgnore,
  toProductionEntry,
} from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { CORE_CLIENT_API, resolveConfigItem } from './helpers.js';
import type { DocusaurusConfig, ResolveResult } from './types.js';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['docusaurus.config.{js,ts}'];

const production = ['src/pages/index.{js,ts,jsx,tsx}', '{blog,docs}/**/*.mdx'];

const resolveConfig: ResolveConfig<DocusaurusConfig> = async (config, options) => {
  const themes = (config?.themes ?? []).map(item => resolveConfigItem(item, 'theme'));
  const plugins = (config?.plugins ?? []).map(item => resolveConfigItem(item, 'plugin'));
  const presets = (config?.presets ?? []).map(item => resolveConfigItem(item, 'preset'));
const entry = ['babel.config.{js,cjs,mjs,cts}'];

  const resolveResults = [...themes, ...plugins, ...presets].filter(
    (result): result is ResolveResult => result !== null
  );

  const hasClassicTheme =
    options.manifest.dependencies?.['@docusaurus/theme-classic'] ||
    options.manifest.dependencies?.['@docusaurus/preset-classic'];

  return [
    toAlias('@site/*', './*'),
    toDependency('@docusaurus/module-type-aliases', { optional: true }),
    // Ignore aliases for @docusaurus/theme-classic/lib/theme/ https://docusaurus.io/docs/advanced/client#theme-aliases
    ...(hasClassicTheme ? [toIgnore('(@theme|@theme-init|@theme-original)/*', 'dependencies')] : []),
    // Ignore aliases for @docusaurus/core/lib/client/exports/ https://docusaurus.io/docs/docusaurus-core
    toIgnore(`@docusaurus/(${CORE_CLIENT_API.join('|')})`, 'dependencies'),
    ...production.map(id => toProductionEntry(id)),
    ...resolveResults.flatMap(result => result.dependencies).map(dep => toDeferResolve(dep)),
    ...resolveResults.flatMap(result => result.entries ?? []).map(entry => toDeferResolveEntry(entry)),
    ...entry.map(id => toEntry(id)),
  ];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
} satisfies Plugin;

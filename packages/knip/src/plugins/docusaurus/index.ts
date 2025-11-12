import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toAlias, toDependency, toEntry, toIgnore, toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { CORE_CLIENT_API, resolveConfigItems } from './helpers.js';
import type { DocusaurusConfig } from './types.js';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['docusaurus.config.{js,mjs,ts}'];

const production = ['src/pages/**/*.{js,ts,jsx,tsx}', '{blog,docs}/**/*.mdx', 'versioned_docs/**/*.{mdx,jsx,tsx}'];

const entry = ['babel.config.{js,cjs,mjs,cts}'];

const resolveConfig: ResolveConfig<DocusaurusConfig> = async (config, options) => {
  const themes = await resolveConfigItems(config.themes ?? [], 'theme', options);
  const plugins = await resolveConfigItems(config.plugins ?? [], 'plugin', options);
  const presets = await resolveConfigItems(config.presets ?? [], 'preset', options);

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
    ...entry.map(id => toEntry(id)),
    ...themes,
    ...plugins,
    ...presets,
  ];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  production,
  resolveConfig,
};

export default plugin;

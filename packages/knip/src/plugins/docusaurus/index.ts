import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toAlias, toDependency, toEntry, toIgnore, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { CORE_CLIENT_API, resolveConfigItems } from './helpers.ts';
import type { DocusaurusConfig } from './types.ts';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['docusaurus.config.{js,mjs,ts}'];

const production = ['src/pages/**/*.{js,ts,jsx,tsx}', '{blog,docs}/**/*.mdx', 'versioned_docs/**/*.{mdx,jsx,tsx}'];

const entry = ['babel.config.{js,cjs,mjs,cts}'];

const resolveStaticAssets = (items: DocusaurusConfig['scripts'] | DocusaurusConfig['stylesheets'], cwd: string) => {
  const entries: Input[] = [];
  for (const item of items ?? []) {
    const value = typeof item === 'string' ? item : (item.src ?? item.href);
    if (typeof value === 'string' && !value.includes('://'))
      entries.push(toProductionEntry(join(cwd, 'static', value)));
  }
  return entries;
};

const resolveConfig: ResolveConfig<DocusaurusConfig> = async (config, options) => {
  const themes = await resolveConfigItems(config.themes ?? [], 'theme', options);
  const plugins = await resolveConfigItems(config.plugins ?? [], 'plugin', options);
  const presets = await resolveConfigItems(config.presets ?? [], 'preset', options);

  const hasClassicTheme =
    options.manifest.dependencies?.['@docusaurus/theme-classic'] ||
    options.manifest.dependencies?.['@docusaurus/preset-classic'];

  const scripts = resolveStaticAssets(config.scripts ?? [], options.cwd);
  const stylesheets = resolveStaticAssets(config.stylesheets ?? [], options.cwd);

  return [
    toAlias('@site/*', './*'),
    toDependency('@docusaurus/module-type-aliases', { optional: true }),
    // Ignore aliases for @docusaurus/theme-classic/lib/theme/ https://docusaurus.io/docs/advanced/client#theme-aliases
    ...(hasClassicTheme ? [toIgnore('(@theme|@theme-init|@theme-original)/*', 'dependencies')] : []),
    // Ignore aliases for @docusaurus/core/lib/client/exports/ https://docusaurus.io/docs/docusaurus-core
    toIgnore(`@docusaurus/(${CORE_CLIENT_API.join('|')})`, 'dependencies'),
    // https://docusaurus.io/blog/releases/3.8
    ...(config.future?.experimental_faster ? [toDependency('@docusaurus/faster')] : []),
    ...production.map(id => toProductionEntry(id)),
    ...entry.map(id => toEntry(id)),
    ...themes,
    ...plugins,
    ...presets,
    ...scripts,
    ...stylesheets,
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

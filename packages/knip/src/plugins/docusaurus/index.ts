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
import { resolveConfigItem } from './helpers.js';
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

  const resolveResults = [...themes, ...plugins, ...presets].filter(
    (result): result is ResolveResult => result !== null
  );

  const hasClassicTheme =
    options.manifest.dependencies?.['@docusaurus/theme-classic'] ||
    options.manifest.dependencies?.['@docusaurus/preset-classic'];

  return [
    toAlias('@site/*', './*'),
    toDependency('@docusaurus/module-type-aliases', { optional: true }),
    // Ignore aliases for @docusaurus/theme-classic/lib/theme/
    ...(hasClassicTheme ? [toIgnore('(@theme|@theme-internal|@theme-original)/*', 'dependencies')] : []),
    // Ignore aliases for @docusaurus/core/lib/client/exports/
    toIgnore(
      '@docusaurus/(BrowserOnly|ComponentCreator|constants|ExecutionEnvironment|Head|Interpolate|isInternalUrl|Link|Noop|renderRoutes|router|Translate|useBaseUrl|useBrokenLinks|useDocusaurusContext|useGlobalData|useIsBrowser|useIsomorphicLayoutEffect|useRouteContext)',
      'dependencies'
    ),
    ...production.map(id => toProductionEntry(id)),
    ...resolveResults.flatMap(result => result.dependencies).map(dep => toDeferResolve(dep)),
    ...resolveResults.flatMap(result => result.entries ?? []).map(entry => toDeferResolveEntry(entry)),
  ];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
} satisfies Plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { ConfigItem, DocusaurusConfig, ModuleType } from './types.js';

// https://docusaurus.io/docs/configuration

const title = 'Docusaurus';

const enablers = ['@docusaurus/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['docusaurus.config.{js,ts}'];

const entry: string[] = [];

const production: string[] = [];

const FIRST_PARTY_MODULES = new Set([
  'content-docs',
  'content-blog',
  'content-pages',
  'debug',
  'sitemap',
  'svgr',
  'rsdoctor',
  'pwa',
  'client-redirects',
  'ideal-image',
  'google-analytics',
  'google-gtag',
  'google-tag-manager',
  'classic',
  'live-codeblock',
  'search-algolia',
  'mermaid',
]);

const resolveModuleName = (name: string, type: ModuleType): string => {
  if (!name.startsWith('@')) {
    const prefix = FIRST_PARTY_MODULES.has(name) ? '@docusaurus/' : 'docusaurus-';
    return `${prefix}${type}-${name}`;
  }

  const [scope, ...rest] = name.split('/');
  const baseName = rest.length ? `-${rest.join('/')}` : '';
  return `${scope}/docusaurus-${type}${baseName}`;
};

const resolveConfigItem = (item: ConfigItem, type: ModuleType): string | null => {
  if (!item) return null;
  const name = Array.isArray(item) ? item[0] : item;
  if (typeof name !== 'string') return null;

  // If it's already a full package name, return it
  if (name.includes(`${type}-`)) return name;
  return resolveModuleName(name, type);
};

const resolveConfig: ResolveConfig<DocusaurusConfig> = async config => {
  const themes = (config?.themes ?? []).map(item => resolveConfigItem(item, 'theme'));
  const plugins = (config?.plugins ?? []).map(item => resolveConfigItem(item, 'plugin'));
  const presets = (config?.presets ?? []).map(item => resolveConfigItem(item, 'preset'));

  return [...themes, ...plugins, ...presets]
    .filter((item): item is string => typeof item === 'string')
    .map(toDeferResolve);
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

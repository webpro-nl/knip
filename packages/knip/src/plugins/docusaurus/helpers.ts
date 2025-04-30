import type { ConfigItem, ModuleType } from './types.js';

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

export const resolveConfigItem = (item: ConfigItem, type: ModuleType): string | null => {
  if (!item) return null;
  const name = Array.isArray(item) ? item[0] : item;
  if (typeof name !== 'string') return null;

  // If it's already a full package name, return it
  if (name.includes(`${type}-`)) return name;
  return resolveModuleName(name, type);
};

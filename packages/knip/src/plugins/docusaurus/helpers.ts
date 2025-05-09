import type { ConfigItem, ModuleType, PluginOptions, PresetOptions, ResolveResult } from './types.js';

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

export const CORE_CLIENT_API = [
  'BrowserOnly',
  'ComponentCreator',
  'constants',
  'ExecutionEnvironment',
  'Head',
  'Interpolate',
  'isInternalUrl',
  'Link',
  'Noop',
  'renderRoutes',
  'router',
  'Translate',
  'useBaseUrl',
  'useBrokenLinks',
  'useDocusaurusContext',
  'useGlobalData',
  'useIsBrowser',
  'useIsomorphicLayoutEffect',
  'useRouteContext',
];

const resolveModuleName = (name: string, type: ModuleType): string => {
  // If it's already a full package name, return it
  if (name.includes(`${type}-`)) return name;

  if (!name.startsWith('@')) {
    const prefix = FIRST_PARTY_MODULES.has(name) ? '@docusaurus/' : 'docusaurus-';
    return `${prefix}${type}-${name}`;
  }

  const [scope, ...rest] = name.split('/');
  const baseName = rest.length ? `-${rest.join('/')}` : '';
  return `${scope}/docusaurus-${type}${baseName}`;
};

const createResult = (dependencies: string[], entries?: string[]): ResolveResult => ({
  dependencies,
  ...(entries && { entries }),
});

const resolveSidebarPath = (config: PresetOptions | PluginOptions): string | undefined => {
  const path = config?.sidebarPath ?? (config as PresetOptions)?.docs?.sidebarPath;
  return typeof path === 'string' ? path : undefined;
};

const resolveArrayConfig = ([name, config]: [string, unknown], type: ModuleType): ResolveResult | null => {
  if (typeof name !== 'string') return null;

  const resolvedName = resolveModuleName(name, type);
  const sidebarPath = type !== 'theme' ? resolveSidebarPath(config as PresetOptions | PluginOptions) : undefined;

  return createResult([resolvedName], sidebarPath ? [sidebarPath] : undefined);
};

export const resolveConfigItem = (item: ConfigItem, type: ModuleType): ResolveResult | null => {
  if (!item) return null;

  if (typeof item === 'string') {
    return createResult([resolveModuleName(item, type)]);
  }

  if (Array.isArray(item)) {
    return resolveArrayConfig(item, type);
  }

  return null;
};

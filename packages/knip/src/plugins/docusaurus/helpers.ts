import type { PluginOptions as Options } from '../../types/config.js';
import { type Input, toDeferResolve, toProductionEntry } from '../../util/input.js';
import { findWebpackDependenciesFromConfig } from '../webpack/index.js';
import type { ConfigItem, ModuleType, PluginOptions, PresetOptions } from './types.js';

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

const resolveSidebarPath = (config: PresetOptions | PluginOptions): string | undefined => {
  const path = config?.sidebarPath ?? (config as PresetOptions)?.docs?.sidebarPath;
  return typeof path === 'string' ? path : undefined;
};

const resolveArrayConfig = ([name, config]: [string, unknown], type: ModuleType) => {
  if (typeof name !== 'string') return [];

  const resolvedName = resolveModuleName(name, type);
  const sidebarPath = type !== 'theme' ? resolveSidebarPath(config as PresetOptions | PluginOptions) : undefined;

  return [toDeferResolve(resolvedName), ...(sidebarPath ? [toProductionEntry(sidebarPath)] : [])];
};

export const resolveConfigItems = async (items: ConfigItem[], type: ModuleType, options: Options) => {
  const inputs = new Set<Input>();

  for (let item of items) {
    if (typeof item === 'function') item = item();

    if (!item) continue;

    if (typeof item === 'string') {
      inputs.add(toDeferResolve(resolveModuleName(item, type)));
    } else if (Array.isArray(item)) {
      for (const input of resolveArrayConfig(item, type)) inputs.add(input);
    } else if (typeof item.configureWebpack === 'function') {
      const utils = { getStyleLoaders: () => [], getJSLoader: () => null };
      const config = item.configureWebpack({}, false, utils);
      for (const input of await findWebpackDependenciesFromConfig(config, options)) inputs.add(input);
    } else if (typeof item.configurePostCss === 'function') {
      // ignore
    }
  }

  return inputs;
};

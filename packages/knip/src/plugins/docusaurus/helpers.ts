import type { PluginOptions as Options } from '../../types/config.ts';
import { type Input, toDeferResolve, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { findWebpackDependenciesFromConfig } from '../webpack/index.ts';
import type { ConfigItem, ModuleType, PluginOptions, PresetOptions } from './types.ts';

const isLocalPath = (name: string): boolean => name.startsWith('.') || name.startsWith('/');

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

const resolveArrayConfig = ([name, config]: [string, unknown], type: ModuleType, cwd: string) => {
  if (typeof name !== 'string') return [];

  const sidebarPath = type !== 'theme' ? resolveSidebarPath(config as PresetOptions | PluginOptions) : undefined;
  const sidebar = sidebarPath ? [toProductionEntry(sidebarPath)] : [];

  if (isLocalPath(name)) return [toProductionEntry(join(cwd, name)), ...sidebar];

  return [toDeferResolve(resolveModuleName(name, type)), ...sidebar];
};

export const resolveConfigItems = async (items: ConfigItem[], type: ModuleType, options: Options) => {
  const inputs = new Set<Input>();

  for (let item of items) {
    if (typeof item === 'function') item = item();

    if (!item) continue;

    if (typeof item === 'string') {
      if (isLocalPath(item)) inputs.add(toProductionEntry(join(options.cwd, item)));
      else inputs.add(toDeferResolve(resolveModuleName(item, type)));
    } else if (Array.isArray(item)) {
      for (const input of resolveArrayConfig(item, type, options.cwd)) inputs.add(input);
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

import type { PluginOptions as Options } from '../../types/config.ts';
import { type Input, toDependency, toEntryPath } from '../../util/input.ts';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { isAbsolute, toAbsolute } from '../../util/path.ts';
import { resolvePackageManifestPath } from '../../util/resolve.ts';
import { findWebpackDependenciesFromConfig } from '../webpack/index.ts';
import type { ConfigItem, ModuleType, PluginOptions, PresetOptions } from './types.ts';

const isLocalPath = (name: string): boolean => name.startsWith('.') || isAbsolute(name);

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

const getNamePatterns = (name: string, type: ModuleType): string[] => {
  if (!name.startsWith('@')) return [name, `@docusaurus/${type}-${name}`, `docusaurus-${type}-${name}`];
  const index = name.indexOf('/');
  if (index === -1) return [`${name}/docusaurus-${type}`];
  return [name, `${name.slice(0, index)}/docusaurus-${type}-${name.slice(index + 1)}`];
};

const isInstalled = (specifier: string, dir: string) => {
  const packageName = getPackageNameFromModuleSpecifier(specifier);
  return packageName && resolvePackageManifestPath(packageName, dir);
};

const resolveModuleName = (name: string, type: ModuleType, dir: string): string => {
  const patterns = getNamePatterns(name, type);
  for (const pattern of patterns) if (isInstalled(pattern, dir)) return pattern;

  // If it's already a full package name, return it
  if (name.includes(`${type}-`)) return name;
  if (FIRST_PARTY_MODULES.has(name)) return `@docusaurus/${type}-${name}`;
  return patterns[patterns.length - 1];
};

const resolveSidebarPath = (config: PresetOptions | PluginOptions): string | undefined => {
  const path = config?.sidebarPath ?? (config as PresetOptions)?.docs?.sidebarPath;
  return typeof path === 'string' ? path : undefined;
};

const toModuleDependency = (name: string, type: ModuleType, dir: string) =>
  toDependency(resolveModuleName(name, type, dir), { production: type !== 'plugin' });

const resolveArrayConfig = ([name, config]: [string, unknown], type: ModuleType, { cwd, configFileDir }: Options) => {
  if (typeof name !== 'string') return [];

  const sidebarPath = type !== 'theme' ? resolveSidebarPath(config as PresetOptions | PluginOptions) : undefined;
  const sidebar = sidebarPath ? [toEntryPath(sidebarPath, { production: true, dir: cwd })] : [];

  if (isLocalPath(name)) return [toEntryPath(toAbsolute(name, cwd), { production: true }), ...sidebar];

  return [toModuleDependency(name, type, configFileDir), ...sidebar];
};

export const resolveConfigItems = async (items: ConfigItem[], type: ModuleType, options: Options) => {
  const inputs = new Set<Input>();

  for (let item of items) {
    if (typeof item === 'function') item = item();

    if (!item) continue;

    if (typeof item === 'string') {
      if (isLocalPath(item)) inputs.add(toEntryPath(toAbsolute(item, options.cwd), { production: true }));
      else inputs.add(toModuleDependency(item, type, options.configFileDir));
    } else if (Array.isArray(item)) {
      for (const input of resolveArrayConfig(item, type, options)) inputs.add(input);
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

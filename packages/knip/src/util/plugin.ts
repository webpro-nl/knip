export { _getDependenciesFromScripts as getDependenciesFromScripts } from '../binaries/index.js';
export { _loadJSON as loadJSON } from './fs.js';
export { _load as load } from './loader.js';
export { _resolveSync as resolve } from './resolve.js';
import type { RawPluginConfiguration } from '../types/config.js';
import type { Plugin, PluginOptions } from '../types/plugins.js';
import { arrayify } from './array.js';
import { _load as load } from './loader.js';
import { get } from './object.js';
import { basename, isAbsolute, join, relative } from './path.js';
import { toEntryPattern, toProductionEntryPattern } from './protocols.js';
import { _resolveSync } from './resolve.js';

export const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

export const hasDependency = (dependencies: Set<string>, values: (string | RegExp)[]) =>
  values.some(value => {
    if (typeof value === 'string') {
      return dependencies.has(value);
    }
    if (value instanceof RegExp) {
      for (const dependency of dependencies) {
        if (value.test(dependency)) return true;
      }
    }
    return false;
  });

export const normalizePluginConfig = (pluginConfig: RawPluginConfiguration) => {
  if (typeof pluginConfig === 'boolean') {
    return pluginConfig;
  }
  const isObject = typeof pluginConfig !== 'string' && !Array.isArray(pluginConfig);
  const config = isObject
    ? 'config' in pluginConfig
      ? arrayify(pluginConfig.config)
      : null
    : pluginConfig
      ? arrayify(pluginConfig)
      : null;
  const entry = isObject && 'entry' in pluginConfig ? arrayify(pluginConfig.entry) : null;
  const project = isObject && 'project' in pluginConfig ? arrayify(pluginConfig.project) : entry;
  return { config, entry, project };
};

export const loadConfigForPlugin = async (
  configFilePath: string,
  plugin: Plugin,
  options: PluginOptions,
  pluginName: string
) => {
  const { packageJsonPath } = plugin;
  const { manifest } = options;

  const localConfig =
    basename(configFilePath) === 'package.json'
      ? typeof packageJsonPath === 'function'
        ? packageJsonPath(manifest)
        : get(manifest, packageJsonPath ?? pluginName)
      : await load(configFilePath);

  return localConfig;
};

export const getFinalEntryPaths = (plugin: Plugin, options: PluginOptions, configEntryPaths: string[]) => {
  const { config, isProduction } = options;

  // TODO Leftover from plugin API streamline refactor
  if (plugin.title === 'Storybook') return [...(config.entry ?? []).map(toEntryPattern), ...configEntryPaths];

  const toEntryPathProtocol =
    isProduction && plugin.production && plugin.production.length > 0 ? toProductionEntryPattern : toEntryPattern;

  return config.entry
    ? config.entry.map(toEntryPathProtocol)
    : configEntryPaths.length > 0
      ? configEntryPaths
      : [...(plugin.entry ?? []).map(toEntryPattern), ...(plugin.production ?? []).map(toProductionEntryPattern)];
};

const toConfigMap =
  (
    defaultExtensions: string[],
    builderConfig: {
      rcPrefix?: string;
      rcSuffix?: string;
      configDir?: boolean;
      configFiles?: boolean;
      configFilesAllExtensions?: boolean;
      additionalExtensions?: string[];
    }
  ) =>
  (moduleName: string, options?: typeof builderConfig) => {
    const config = {
      rcPrefix: '.',
      rcSuffix: 'rc',
      // Generate .config/<file>
      configDir: true,
      // Generate <file>.config.<ext>
      configFiles: true,
      // Allow for .json, .yaml, .yml, .toml etc
      configFilesAllExtensions: false,
      additionalExtensions: [],
      ...builderConfig,
      ...options,
    };
    const { rcPrefix, rcSuffix } = config;
    const jsTypeExtensions = ['js', 'ts', 'cjs', 'mjs', 'cts', 'mts'];
    const extensions = [...defaultExtensions, ...config.additionalExtensions];

    const baseFiles = [
      `${rcPrefix}${moduleName}${rcSuffix}`,
      ...(config.configDir ? [`.config/${moduleName}${rcSuffix}`] : []),
    ];

    const rcFiles = `${rcPrefix}${moduleName}${rcSuffix}.{${extensions.join(',')}}`;
    const configExtensions = extensions.filter(
      ext => config.configFilesAllExtensions || jsTypeExtensions.includes(ext)
    );
    const configFiles = config.configFiles ? [`${moduleName}.config.{${configExtensions.join(',')}}`] : [];
    const configDirFiles = config.configDir ? [`.config/${moduleName}${rcSuffix}.{${extensions.join(',')}}`] : [];

    return [...baseFiles, rcFiles, ...configFiles, ...configDirFiles];
  };

export const toCosmiconfig = toConfigMap(['json', 'yaml', 'yml', 'js', 'ts', 'cjs', 'mjs'], { configDir: true });
export const toLilconfig = toConfigMap(['json', 'js', 'cjs', 'mjs'], { configDir: true });
export const toUnconfig = toConfigMap(['json', 'ts', 'mts', 'cts', 'js', 'mjs', 'cjs'], {
  configDir: false,
  rcPrefix: '',
  rcSuffix: '',
  configFiles: false,
});

export const resolveEntry = (options: PluginOptions, specifier: string, rootDir = '.') => {
  const { configFileDir } = options;
  const resolvedPath = isAbsolute(specifier)
    ? specifier
    : _resolveSync(join(configFileDir, rootDir, specifier), join(configFileDir, rootDir));

  if (resolvedPath) return toEntryPattern(relative(configFileDir, resolvedPath));

  return specifier;
};

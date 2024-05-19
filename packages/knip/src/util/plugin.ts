export { _load as load } from './loader.js';
export { _loadJSON as loadJSON } from './fs.js';
export { _tryResolve as tryResolve } from './require.js';
export { _getDependenciesFromScripts as getDependenciesFromScripts } from '../binaries/index.js';
import type { RawPluginConfiguration } from '../types/config.js';
import type { Plugin, PluginOptions } from '../types/plugins.js';
import { arrayify } from './array.js';
import { _load as load } from './loader.js';
import { get } from './object.js';
import { basename } from './path.js';
import { toEntryPattern, toProductionEntryPattern } from './protocols.js';
import { _loadESLintConfig as loadESLintConfig } from './require.js';

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
      ? get(
          manifest,
          (Array.isArray(packageJsonPath) ? packageJsonPath.find(path => get(manifest, path)) : packageJsonPath) ??
            pluginName
        )
      : // TODO Leftover from plugin API streamline refactor
        plugin.title === 'ESLint' && !/(\.(jsonc?|ya?ml)|rc)$/.test(configFilePath)
        ? await loadESLintConfig(configFilePath)
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

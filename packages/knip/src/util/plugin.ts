export { _load as load } from './loader.js';
import type { Plugin, PluginOptions, RawPluginConfiguration } from '../types/config.js';
import { arrayify } from './array.js';
import { type Input, toEntry, toProductionEntry } from './input.js';
import { _load as load } from './loader.js';
import { get } from './object.js';
import { basename } from './path.js';

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

export const getFinalEntryPaths = (plugin: Plugin, options: PluginOptions, configEntryPaths: Input[]) => {
  const { config, isProduction } = options;

  // TODO Leftover from plugin API streamline refactor
  if (plugin.title === 'Storybook') return [...(config.entry ?? []).map(toEntry), ...configEntryPaths];

  const toEntryPathProtocol =
    isProduction && plugin.production && plugin.production.length > 0 ? toProductionEntry : toEntry;

  if (config.entry) return config.entry.map(id => toEntryPathProtocol(id));

  if (configEntryPaths.length > 0) return configEntryPaths;

  return [...(plugin.entry ?? []).map(toEntry), ...(plugin.production ?? []).map(id => toProductionEntry(id))];
};

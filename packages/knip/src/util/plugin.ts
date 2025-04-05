export { _load as load } from './loader.js';
import type { Plugin, PluginOptions, RawPluginConfiguration } from '../types/config.js';
import { arrayify } from './array.js';
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

  return basename(configFilePath) === 'package.json'
    ? typeof packageJsonPath === 'function'
      ? packageJsonPath(manifest)
      : get(manifest, packageJsonPath ?? pluginName)
    : await load(configFilePath);
};

export { _load as load } from './loader.ts';

import type { Plugin, PluginOptions, RawPluginConfiguration } from '../types/config.ts';
import { arrayify } from './array.ts';
import { _load as load } from './loader.ts';
import { get } from './object.ts';
import { basename } from './path.ts';

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
  if (typeof pluginConfig === 'boolean') return pluginConfig;

  if (typeof pluginConfig === 'string' || Array.isArray(pluginConfig)) {
    return { config: pluginConfig ? arrayify(pluginConfig) : null, entry: null, project: [] };
  }

  const config = pluginConfig.config === undefined ? null : arrayify(pluginConfig.config);

  const entry = pluginConfig.entry === undefined ? null : arrayify(pluginConfig.entry);

  const project =
    pluginConfig.project === undefined
      ? (entry ?? []).filter(pattern => !pattern.startsWith('!'))
      : arrayify(pluginConfig.project);

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

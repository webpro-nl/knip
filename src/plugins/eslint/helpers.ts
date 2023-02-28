import path from 'node:path';
import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { require } from '../../util/require.js';
import type { ESLintConfig } from './types.js';

const getDependencies = (config: ESLintConfig) => {
  const extend = config.extends ? [config.extends].flat().map(customResolvePluginPackageNames) : [];
  if (extend.includes('eslint-plugin-prettier')) extend.push('eslint-config-prettier');
  const plugins = config.plugins ? config.plugins.map(resolvePluginPackageName) : [];
  const parser = config.parser;
  const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  return compact([...extend, ...plugins, parser, ...extraParsers, ...settings]).map(getPackageName);
};

export const getDependenciesDeep = async (configFilePath: string, dependencies: Set<string> = new Set()) => {
  const addAll = (deps: string[] | Set<string>) => deps.forEach(dependency => dependencies.add(dependency));

  const config: ESLintConfig = await _load(configFilePath);

  if (config.extends) {
    for (const extend of [config.extends].flat()) {
      if (extend.startsWith('.') || (extend.startsWith('/') && !extend.includes('/node_modules/'))) {
        const extendConfigFilePath = extend.startsWith('/')
          ? extend
          : require.resolve(path.join(path.dirname(configFilePath), extend));
        addAll(await getDependenciesDeep(extendConfigFilePath));
      }
    }
  }

  if (config.overrides) for (const override of config.overrides) addAll(getDependencies(override));

  addAll(getDependencies(config));

  return dependencies;
};

const resolvePackageName = (namespace: 'eslint-plugin' | 'eslint-config', pluginName: string) => {
  return pluginName.startsWith('@')
    ? pluginName.includes('/')
      ? pluginName.replace(/\//, `/${namespace}-`)
      : `${pluginName}/${namespace}`
    : `${namespace}-${pluginName}`;
};

export const resolvePluginPackageName = (pluginName: string) => resolvePackageName('eslint-plugin', pluginName);

const customResolvePluginPackageNames = (extend: string) => {
  if (extend.includes('/node_modules/')) return getPackageName(extend);
  if (extend.startsWith('/') || extend.startsWith('.')) return;
  if (extend.includes(':')) {
    const pluginName = extend.replace(/^plugin:/, '').replace(/(\/|:).+$/, '');
    if (pluginName === 'eslint') return;
    return resolvePackageName('eslint-plugin', pluginName);
  }
  // TODO Slippery territory, not sure what we have here
  return extend.includes('eslint') ? getPackageName(extend) : resolvePackageName('eslint-config', extend);
};

const getImportPluginDependencies = (settings: Record<string, unknown>) => {
  const knownKeys = ['typescript'];
  if (Array.isArray(settings)) return [];
  return Object.keys(settings)
    .filter(key => key !== 'node') // eslint-import-resolver-node is a direct dep of eslint-plugin-import
    .map(key => (knownKeys.includes(key) ? `eslint-import-resolver-${key}` : key));
};

// Super custom: find dependencies of specific ESLint plugins through settings
export const getDependenciesFromSettings = (settings: ESLintConfig['settings'] = {}) => {
  return compact(
    Object.entries(settings).reduce((packageNames, [settingKey, settings]) => {
      if (/^import\/(parsers|resolvers)?/.test(settingKey)) {
        return [...packageNames, ...getImportPluginDependencies(settings)];
      }
      return packageNames;
    }, [] as string[])
  );
};

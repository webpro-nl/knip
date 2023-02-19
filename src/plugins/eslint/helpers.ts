import path from 'node:path';
import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { isAbsolute, isInNodeModules } from '../../util/path.js';
import { _resolve } from '../../util/require.js';
import { fallback } from './fallback.js';
import type { ESLintConfig } from './types.js';
import type { PackageJson } from 'type-fest';

type Manifest = PackageJson & { eslintConfig?: ESLintConfig };

const getDependencies = (config: ESLintConfig) => {
  const extend = config.extends ? [config.extends].flat().map(customResolvePluginPackageNames) : [];
  if (extend.includes('eslint-plugin-prettier')) extend.push('eslint-config-prettier');
  const plugins = config.plugins ? config.plugins.map(resolvePluginPackageName) : [];
  const parser = config.parser;
  const extraParsers = config.parserOptions?.babelOptions?.presets ?? [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  return compact([...extend, ...plugins, parser, ...extraParsers, ...settings]);
};

type GetDependenciesDeep = (
  configFilePath: string,
  dependencies: Set<string>,
  options: { cwd: string; manifest: Manifest }
) => Promise<Set<string>>;

export const getDependenciesDeep: GetDependenciesDeep = async (configFilePath, dependencies = new Set(), options) => {
  const addAll = (deps: string[] | Set<string>) => deps.forEach(dependency => dependencies.add(dependency));

  let config = configFilePath.endsWith('package.json') ? options.manifest.eslintConfig : undefined;

  if (!config) {
    try {
      config = await _load(configFilePath);
    } catch (err) {
      if (err instanceof Error && err.cause instanceof Error && /Failed to patch ESLint/.test(err.cause.message)) {
        // Fallback - or actually native - mechanism kicks in for @rushstack/eslint-patch/modern-module-resolution
        const dependencies = await fallback(configFilePath, options);
        addAll(dependencies);
      } else {
        throw err;
      }
    }
  }

  if (config) {
    if (config.extends) {
      for (const extend of [config.extends].flat()) {
        if (extend.startsWith('.') || (isAbsolute(extend) && !isInNodeModules(extend))) {
          const filePath = isAbsolute(extend) ? extend : path.join(path.dirname(configFilePath), extend);
          const extendConfigFilePath = _resolve(filePath);
          addAll(await getDependenciesDeep(extendConfigFilePath, dependencies, options));
        }
      }
    }

    if (config.overrides) for (const override of [config.overrides].flat()) addAll(getDependencies(override));

    addAll(getDependencies(config));
  }

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
  if (isInNodeModules(extend)) return getPackageName(extend);
  if (isAbsolute(extend) || extend.startsWith('.')) return;
  if (extend.includes(':')) {
    const pluginName = extend.replace(/^plugin:/, '').replace(/(\/|:).+$/, '');
    if (pluginName === 'eslint') return;
    return resolvePackageName('eslint-plugin', pluginName);
  }
  // TODO Slippery territory, not sure what we have here
  return extend.includes('eslint') ? extend : resolvePackageName('eslint-config', extend);
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

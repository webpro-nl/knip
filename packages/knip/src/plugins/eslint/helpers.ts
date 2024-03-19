import { compact } from '#p/util/array.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from '#p/util/modules.js';
import { isInternal, toAbsolute, isAbsolute } from '#p/util/path.js';
import { load } from '#p/util/plugin.js';
import { _resolve } from '#p/util/require.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { ESLintConfig, OverrideConfig } from './types.js';
import type { PluginOptions } from '../../types/plugins.js';

const getDependencies = (config: ESLintConfig | OverrideConfig) => {
  const extendsSpecifiers = config.extends ? [config.extends].flat().map(resolveExtendSpecifier) : [];
  // https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
  if (extendsSpecifiers.some(specifier => specifier?.startsWith('eslint-plugin-prettier')))
    extendsSpecifiers.push('eslint-config-prettier');

  const plugins = config.plugins ? config.plugins.map(resolvePluginSpecifier) : [];
  const parser = config.parser ?? config.parserOptions?.parser;
  const babelDependencies = config.parserOptions?.babelOptions
    ? getDependenciesFromConfig(config.parserOptions.babelOptions)
    : [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  const overrides: string[] = config.overrides ? [config.overrides].flat().flatMap(getDependencies) : [];

  return compact([...extendsSpecifiers, ...plugins, parser, ...babelDependencies, ...settings, ...overrides]);
};

type GetDependenciesDeep = (
  localConfig: ESLintConfig,
  options: PluginOptions,
  dependencies?: Set<string>
) => Promise<Set<string>>;

export const getDependenciesDeep: GetDependenciesDeep = async (localConfig, options, dependencies = new Set()) => {
  const { configFileDir } = options;
  const addAll = (deps: string[] | Set<string>) => deps.forEach(dependency => dependencies.add(dependency));

  if (localConfig) {
    if (localConfig.extends) {
      for (const extend of [localConfig.extends].flat()) {
        if (isInternal(extend)) {
          const filePath = toAbsolute(extend, configFileDir);
          const extendConfigFilePath = _resolve(filePath);
          dependencies.add(extendConfigFilePath);
          const localConfig: ESLintConfig = await load(extendConfigFilePath);
          addAll(await getDependenciesDeep(localConfig, options, dependencies));
        }
      }
    }

    addAll(getDependencies(localConfig));
  }

  return dependencies;
};

const isQualifiedSpecifier = (specifier: string) =>
  specifier === 'eslint' ||
  /\/eslint-(config|plugin)$/.test(specifier) ||
  /.+eslint-(config|plugin)\//.test(specifier) ||
  /eslint-(config|plugin)-/.test(specifier);

const resolveSpecifier = (namespace: 'eslint-plugin' | 'eslint-config', rawSpecifier: string) => {
  const specifier = rawSpecifier.replace(/(^plugin:|:.+$)/, '');
  if (isQualifiedSpecifier(specifier)) return specifier;
  if (!specifier.startsWith('@')) {
    const id = rawSpecifier.startsWith('plugin:')
      ? getPackageNameFromModuleSpecifier(specifier)
      : specifier.split('/')[0];
    return `${namespace}-${id}`;
  }
  const [scope, name, ...rest] = specifier.split('/');
  if (rawSpecifier.startsWith('plugin:') && rest.length === 0) return [scope, namespace].join('/');
  return [scope, name ? `${namespace}-${name}` : namespace, ...rest].join('/');
};

const resolvePluginSpecifier = (specifier: string) => resolveSpecifier('eslint-plugin', specifier);

const resolveExtendSpecifier = (specifier: string) => {
  if (isInternal(specifier)) return;

  const namespace = specifier.startsWith('plugin:') ? 'eslint-plugin' : 'eslint-config';
  return resolveSpecifier(namespace, specifier);
};

// Super custom: find dependencies of specific ESLint plugins through settings
const getDependenciesFromSettings = (settings: ESLintConfig['settings'] = {}) => {
  return Object.entries(settings).flatMap(([settingKey, settings]) => {
    if (settingKey === 'import/resolver') {
      return (typeof settings === 'string' ? [settings] : Object.keys(settings))
        .filter(key => key !== 'node')
        .map(key => {
          // TODO Resolve properly
          if (isInternal(key)) return key;
          if (isAbsolute(key)) return getPackageNameFromFilePath(key);
          return `eslint-import-resolver-${key}`;
        });
    }
    if (settingKey === 'import/parsers') {
      return (typeof settings === 'string' ? [settings] : Object.keys(settings)).map(key => {
        // TODO Resolve properly
        if (isAbsolute(key)) return getPackageNameFromFilePath(key);
        return key;
      });
    }
  });
};

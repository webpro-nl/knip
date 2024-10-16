import type { PluginOptions } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { type ConfigDependency, type Dependency, toConfig, toDeferResolve } from '../../util/dependencies.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { isAbsolute, isInternal } from '../../util/path.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { ESLintConfig, OverrideConfig } from './types.js';

export const getDependencies = (
  config: ESLintConfig | OverrideConfig,
  options: PluginOptions
): (Dependency | ConfigDependency)[] => {
  const extendsSpecifiers = config.extends ? compact([config.extends].flat().map(resolveExtendSpecifier)) : [];
  // https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
  if (extendsSpecifiers.some(specifier => specifier?.startsWith('eslint-plugin-prettier')))
    extendsSpecifiers.push('eslint-config-prettier');
  const extendConfigs = extendsSpecifiers.map(specifier => toConfig('eslint', specifier));
  const plugins = config.plugins ? config.plugins.map(resolvePluginSpecifier) : [];
  const parser = config.parser ?? config.parserOptions?.parser;
  const babelDependencies = config.parserOptions?.babelOptions
    ? getDependenciesFromConfig(config.parserOptions.babelOptions)
    : [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  // const rules = getDependenciesFromRules(config.rules); // TODO enable in next major? Unexpected/breaking in certain cases w/ eslint v8
  const rules = getDependenciesFromRules({});
  const overrides = config.overrides ? [config.overrides].flat().flatMap(d => getDependencies(d, options)) : [];
  const x = compact([...extendsSpecifiers, ...plugins, parser, ...settings, ...rules]).map(toDeferResolve);
  return [...extendConfigs, ...x, ...babelDependencies, ...overrides];
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

const getDependenciesFromRules = (rules: ESLintConfig['rules'] = {}) =>
  Object.keys(rules).flatMap(ruleKey =>
    ruleKey.includes('/') ? [resolveSpecifier('eslint-plugin', ruleKey.split('/').slice(0, -1).join('/'))] : []
  );

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

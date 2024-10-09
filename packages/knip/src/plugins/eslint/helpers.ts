import type { PluginOptions } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { basename, dirname, isAbsolute, isInternal, toAbsolute } from '../../util/path.js';
import { load, resolve } from '../../util/plugin.js';
import { type Dependency, toDeferResolve, toEntry } from '../../util/protocols.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { ESLintConfig, OverrideConfig } from './types.js';

const getDependencies = (config: ESLintConfig | OverrideConfig): Dependency[] => {
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
  // const rules = getDependenciesFromRules(config.rules); // TODO enable in next major? Unexpected/breaking in certain cases w/ eslint v8
  const rules = getDependenciesFromRules({});
  const overrides: Dependency[] = config.overrides ? [config.overrides].flat().flatMap(getDependencies) : [];

  const x = compact([...extendsSpecifiers, ...plugins, parser, ...settings, ...rules]).map(toDeferResolve);

  return [...x, ...babelDependencies, ...overrides];
};

type GetDependenciesDeep = (
  localConfig: ESLintConfig,
  options: PluginOptions,
  dependencies?: Set<Dependency>
) => Promise<Set<Dependency>>;

export const getDependenciesDeep: GetDependenciesDeep = async (localConfig, options, dependencies = new Set()) => {
  const { configFileDir } = options;
  const addAll = (deps: Dependency[] | Set<Dependency>) => {
    for (const dependency of deps) dependencies.add(dependency);
  };

  if (localConfig) {
    if (localConfig.extends) {
      for (const extend of [localConfig.extends].flat()) {
        if (isInternal(extend)) {
          const filePath = resolve(toAbsolute(extend, configFileDir), configFileDir);
          if (filePath) {
            dependencies.add(toEntry(filePath));
            const localConfig: ESLintConfig = await load(filePath);
            const opts = { ...options, configFileDir: dirname(filePath), configFileName: basename(filePath) };
            addAll(await getDependenciesDeep(localConfig, opts, dependencies));
          }
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

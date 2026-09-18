import type { PluginOptions } from '../../types/config.ts';
import type { Manifest } from '../../util/package-json.ts';
import { compact } from '../../util/array.ts';
import { type ConfigInput, type Input, toConfig, toDeferResolve, toDependency } from '../../util/input.ts';
import { getPackageNameFromFilePath, getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { extname, isAbsolute, isInternal } from '../../util/path.ts';
import { substringBefore } from '../../util/string.ts';
import { getDependenciesFromConfig } from '../babel/index.ts';
import type { BaseConfig, ESLintConfig, ESLintConfigDeprecated, OverrideConfigDeprecated, Settings } from './types.ts';

export const isFlatConfig = (fileName: string) => /eslint\.config/.test(fileName);

export const getInputs = (
  config: ESLintConfigDeprecated | OverrideConfigDeprecated | ESLintConfig,
  options: PluginOptions
): (Input | ConfigInput)[] => {
  const { configFileName } = options;

  if (extname(configFileName) === '.json' || !isFlatConfig(configFileName)) {
    return getInputsDeprecated(config as ESLintConfigDeprecated | OverrideConfigDeprecated, options);
  }

  const configArray = Array.isArray(config) ? config : [config];
  const dependencies = configArray.flatMap(config =>
    config.settings ? getDependenciesFromSettings(config.settings) : []
  );

  dependencies.push('eslint-import-resolver-typescript');

  return compact(dependencies).map(id => toDeferResolve(id, { optional: true }));
};

const getInputsDeprecated = (
  config: ESLintConfigDeprecated | OverrideConfigDeprecated,
  options: PluginOptions
): (Input | ConfigInput)[] => {
  const extendsList = config.extends ? [config.extends].flat() : [];
  const extendsSpecifiers = compact(extendsList.map(resolveExtendSpecifier));
  // https://github.com/prettier/eslint-plugin-prettier#recommended-configuration
  if (extendsSpecifiers.some(specifier => specifier?.startsWith('eslint-plugin-prettier')))
    extendsSpecifiers.push('eslint-config-prettier');
  const extendConfigs = [...extendsList.filter(isInternal), ...extendsSpecifiers].map(specifier =>
    toConfig('eslint', specifier, { containingFilePath: options.configFilePath })
  );
  const plugins = config.plugins ? config.plugins.map(resolvePluginSpecifier) : [];
  const parsers = getParsers(config);
  const babelDependencies = config.parserOptions?.babelOptions
    ? getDependenciesFromConfig(config.parserOptions.babelOptions)
    : [];
  const settings = config.settings ? getDependenciesFromSettings(config.settings) : [];
  // const rules = getDependenciesFromRules(config.rules); // TODO enable in next major? Unexpected/breaking in certain cases w/ eslint v8
  const rules = getDependenciesFromRules({});
  const overrides = config.overrides ? [config.overrides].flat().flatMap(d => getInputsDeprecated(d, options)) : [];
  const deferred = compact([...extendsSpecifiers, ...plugins, ...settings, ...rules]).map(id => toDeferResolve(id));
  return [...extendConfigs, ...deferred, ...parsers, ...babelDependencies, ...overrides];
};

const isParserObject = (value: Record<string, unknown>) =>
  typeof value.parseForESLint === 'function' || typeof value.parse === 'function';

const toParser = (name: string) => toDeferResolve(name, name === 'espree' ? { optional: true } : {});

const getParsers = ({ parser, parserOptions }: BaseConfig) => {
  const inputs: Input[] = [];
  for (const value of [parser, parserOptions?.parser]) {
    if (typeof value === 'string') inputs.push(toParser(value));
    else if (value && typeof value === 'object' && !isParserObject(value)) {
      for (const name of Object.values(value)) if (typeof name === 'string') inputs.push(toParser(name));
    }
  }
  return inputs;
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
      : substringBefore(specifier, '/');
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

const getDependenciesFromRules = (rules: ESLintConfigDeprecated['rules'] = {}) =>
  Object.keys(rules).flatMap(ruleKey =>
    ruleKey.includes('/') ? [resolveSpecifier('eslint-plugin', ruleKey.split('/').slice(0, -1).join('/'))] : []
  );

const getResolverNames = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(getResolverNames);
  if (value && typeof value === 'object') return Object.keys(value);
  return [];
};

export type ImportSettingKind = 'resolver' | 'parsers';

export const importSettingKinds = new Map<string, ImportSettingKind>([
  ['import/resolver', 'resolver'],
  ['import-x/resolver', 'resolver'],
  ['import-x/resolver-legacy', 'resolver'],
  ['import/parsers', 'parsers'],
  ['import-x/parsers', 'parsers'],
]);

const getDependenciesFromSettings = (settings: ESLintConfigDeprecated['settings'] = {}) => {
  return Object.entries(settings).flatMap(([settingKey, settings]) => {
    const kind = importSettingKinds.get(settingKey);
    if (kind === 'resolver') {
      return getResolverNames(settings)
        .filter(key => key !== 'node')
        .map(key => {
          // TODO Resolve properly
          if (isInternal(key)) return key;
          if (isAbsolute(key)) return getPackageNameFromFilePath(key);
          return `eslint-import-resolver-${key}`;
        });
    }
    if (kind === 'parsers') {
      return (typeof settings === 'string' ? [settings] : Object.keys(settings)).map(key => {
        // TODO Resolve properly
        if (isAbsolute(key)) return getPackageNameFromFilePath(key);
        return key;
      });
    }
  });
};

export const getInputsFromSettings = (settings?: Settings) =>
  compact(getDependenciesFromSettings(settings)).map(id => toDeferResolve(id, { optional: true }));

const builtinFormatters = new Set(['html', 'json-with-metadata', 'json', 'stylish']);
const builtinFormattersUntilV8 = new Set([
  'checkstyle',
  'compact',
  'jslint-xml',
  'junit',
  'tap',
  'unix',
  'visualstudio',
]);

const normalizeFormatterName = (name: string) => {
  if (!name.startsWith('@')) return name.startsWith('eslint-formatter-') ? name : `eslint-formatter-${name}`;
  const [scope, id] = name.split('/');
  if (!id) return `${scope}/eslint-formatter`;
  return /^eslint-formatter(-|$)/.test(id) ? name : name.replace('/', '/eslint-formatter-');
};

export const resolveFormatters = (formatters: string | string[], manifest: Manifest) => {
  const inputs: Set<Input> = new Set();
  const isBeforeV9 = (manifest.getMajor('eslint') ?? 9) < 9;
  for (const rawFormatter of [formatters].flat()) {
    const formatter = rawFormatter.replace(/\\/g, '/');
    if (!formatter.startsWith('@') && formatter.includes('/')) {
      inputs.add(toDeferResolve(isInternal(formatter) ? formatter : `./${formatter}`));
    } else {
      const isBuiltin = builtinFormatters.has(formatter) || (isBeforeV9 && builtinFormattersUntilV8.has(formatter));
      inputs.add(toDependency(normalizeFormatterName(formatter), isBuiltin ? { optional: true } : {}));
    }
  }
  return inputs;
};

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { type Input, toConfig, toModule, toDependency } from '../../util/input.ts';
import { getPackageNameFromSpecifier } from '../../util/modules.ts';
import { hasDependency } from '../../util/plugin.ts';
import { api, resolveName } from './helpers.ts';
import type { BabelConfig, BabelConfigObj } from './types.ts';

// https://babeljs.io/docs/configuration
// https://babeljs.io/docs/options#name-normalization
// https://github.com/babel/babel/blob/v7.28.5/packages/babel-core/src/config/config-chain.ts#L668-L705
// https://github.com/babel/babel/blob/v7.28.5/packages/babel-core/src/config/files/configuration.ts#L27-L43

const title = 'Babel';

const enablers = [/^@babel\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'babel.config.{json,js,cjs,mjs,cts,ts,mts}',
  '.babelrc.{json,js,cjs,mjs,cts}',
  '.babelrc',
  'package.json',
];

const getName = (value: string | [string, unknown]) =>
  [Array.isArray(value) ? value[0] : value].filter(name => typeof name === 'string');

const DECORATOR_TRANSFORMS = 'decorator-transforms';

const isRuntimeImportPlugin = (value: unknown) => {
  if (!Array.isArray(value) || typeof value[0] !== 'string') return false;
  if (getPackageNameFromSpecifier(resolveName(value[0], 'plugin')) !== DECORATOR_TRANSFORMS) return false;
  const runtime = value[1]?.runtime;
  return typeof runtime?.import === 'string';
};

export const getDependenciesFromConfig = (config: BabelConfigObj, isProduction = true): Input[] => {
  const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
  const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
  const toInputs = (config: BabelConfigObj) => getDependenciesFromConfig(config, isProduction);
  const nested = config.env ? Object.values(config.env).flatMap(toInputs) : [];
  const overrides = config.overrides ? [config.overrides].flat().flatMap(toInputs) : [];
  return compact([
    ...presets.map(id => toModule(id)),
    ...plugins.map(id => toModule(id)),
    ...(plugins.includes('@babel/plugin-transform-runtime')
      ? [toDependency('@babel/runtime', { optional: true, production: isProduction })]
      : []),
    ...(config.plugins?.some(isRuntimeImportPlugin)
      ? [toDependency(DECORATOR_TRANSFORMS, { production: isProduction })]
      : []),
    ...nested,
    ...overrides,
  ]);
};

const getExtendedConfigs = (config: BabelConfigObj): Input[] => [
  ...(config.extends ? [toConfig('babel', config.extends)] : []),
  ...Object.values(config.env ?? {}).flatMap(getExtendedConfigs),
  ...(config.overrides ?? []).flatMap(getExtendedConfigs),
];

const resolveConfig: ResolveConfig<BabelConfig> = async config => {
  if (typeof config === 'function') config = config(api);

  if (!config) return [];

  return [...getExtendedConfigs(config), ...getDependenciesFromConfig(config)];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

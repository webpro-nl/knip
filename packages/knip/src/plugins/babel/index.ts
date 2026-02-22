import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { type Input, toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { api, resolveName } from './helpers.ts';
import type { BabelConfig, BabelConfigObj } from './types.ts';

// https://babeljs.io/docs/configuration
// https://babeljs.io/docs/options#name-normalization

const title = 'Babel';

const enablers = [/^@babel\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['babel.config.{json,js,cjs,mjs,cts,ts}', '.babelrc.{json,js,cjs,mjs,cts}', '.babelrc', 'package.json'];

const getName = (value: string | [string, unknown]) =>
  [Array.isArray(value) ? value[0] : value].filter(name => typeof name === 'string');

export const getDependenciesFromConfig = (config: BabelConfigObj): Input[] => {
  const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
  const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  const overrides = config.overrides ? [config.overrides].flat().flatMap(getDependenciesFromConfig) : [];
  return compact([
    ...presets.map(id => toDeferResolve(id)),
    ...plugins.map(id => toDeferResolve(id)),
    ...nested,
    ...overrides,
  ]);
};

const resolveConfig: ResolveConfig<BabelConfig> = async config => {
  if (typeof config === 'function') config = config(api);

  if (!config) return [];

  return getDependenciesFromConfig(config);
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

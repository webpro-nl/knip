import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { type Input, toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { api, resolveName } from './helpers.js';
import type { BabelConfig, BabelConfigObj } from './types.js';

// https://babeljs.io/docs/configuration
// https://babeljs.io/docs/options#name-normalization

const title = 'Babel';

const enablers = [/^@babel\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['babel.config.{json,js,cjs,mjs,cts}', '.babelrc.{json,js,cjs,mjs,cts}', '.babelrc', 'package.json'];

const getName = (value: string | [string, unknown]) =>
  [Array.isArray(value) ? value[0] : value].filter(name => typeof name === 'string');

export const getDependenciesFromConfig = (config: BabelConfigObj): Input[] => {
  const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
  const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  const overrides = config.overrides ? [config.overrides].flat().flatMap(getDependenciesFromConfig) : [];
  return compact([...presets.map(toDeferResolve), ...plugins.map(toDeferResolve), ...nested, ...overrides]);
};

const resolveConfig: ResolveConfig<BabelConfig> = async config => {
  if (typeof config === 'function') config = config(api);

  if (!config) return [];

  return getDependenciesFromConfig(config);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

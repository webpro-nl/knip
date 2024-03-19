import { compact } from '#p/util/array.js';
import { hasDependency } from '#p/util/plugin.js';
import { resolveName, api } from './helpers.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { BabelConfig, BabelConfigObj } from './types.js';

// https://babeljs.io/docs/configuration
// https://babeljs.io/docs/options#name-normalization

const title = 'Babel';

const enablers = [/^@babel\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['babel.config.{json,js,cjs,mjs,cts}', '.babelrc.{json,js,cjs,mjs,cts}', '.babelrc', 'package.json'];

const getName = (value: string | [string, unknown]) =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? [value[0]] : [];

export const getDependenciesFromConfig = (config: BabelConfigObj): string[] => {
  const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
  const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  return compact([...presets, ...plugins, ...nested]);
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
};

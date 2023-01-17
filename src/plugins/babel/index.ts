import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import { resolvePresetName, resolvePluginName, api } from './helpers.js';
import type { BabelConfig, BabelConfigFn } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://babeljs.io/docs/en/configuration

export const NAME = 'Babel';

/** @public */
export const ENABLERS = [/^@babel\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'babel.config.json',
  'babel.config.js',
  '.babelrc.json',
  '.babelrc.js',
  '.babelrc',
  'package.json',
];

const getItemName = (value: string | [string, unknown]) =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? [value[0]] : [];

export const getDependenciesFromConfig = (config: BabelConfig): string[] => {
  const presets = config.presets?.flatMap(getItemName).map(resolvePresetName) ?? [];
  const plugins = config.plugins?.flatMap(getItemName).map(resolvePluginName) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  return compact([...presets, ...plugins, ...nested]).map(getPackageName);
};

const findBabelDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  let config: BabelConfig | BabelConfigFn = configFilePath.endsWith('package.json')
    ? manifest.babel
    : await _load(configFilePath);
  if (typeof config === 'function') {
    config = config(api);
  }
  return config ? getDependenciesFromConfig(config) : [];
};

export const findDependencies = timerify(findBabelDependencies);

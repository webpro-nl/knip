import { compact } from '../../util/array.js';
import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { resolveName, api } from './helpers.js';
import type { BabelConfig, BabelConfigObj } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://babeljs.io/docs/configuration
// https://babeljs.io/docs/options#name-normalization

const NAME = 'Babel';

const ENABLERS = [/^@babel\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = [
  'babel.config.{json,js,cjs,mjs,cts}',
  '.babelrc.{json,js,cjs,mjs,cts}',
  '.babelrc',
  'package.json',
];

const getName = (value: string | [string, unknown]) =>
  typeof value === 'string' ? [value] : Array.isArray(value) ? [value[0]] : [];

export const getDependenciesFromConfig = (config: BabelConfigObj): string[] => {
  const presets = config.presets?.flatMap(getName).map(name => resolveName(name, 'preset')) ?? [];
  const plugins = config.plugins?.flatMap(getName).map(name => resolveName(name, 'plugin')) ?? [];
  const nested = config.env ? Object.values(config.env).flatMap(getDependenciesFromConfig) : [];
  return compact([...presets, ...plugins, ...nested]);
};

const findBabelDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  let localConfig: BabelConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.babel : await load(configFilePath);

  if (typeof localConfig === 'function') localConfig = localConfig(api);

  if (!localConfig) return [];

  return getDependenciesFromConfig(localConfig);
};

const findDependencies = timerify(findBabelDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

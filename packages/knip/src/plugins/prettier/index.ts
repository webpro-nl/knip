import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PrettierConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://prettier.io/docs/en/configuration.html

const NAME = 'Prettier';

const ENABLERS = ['prettier'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies, config }) =>
  hasDependency(dependencies, ENABLERS) || 'prettier' in config;

const CONFIG_FILE_PATTERNS = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,yml,yaml}',
  'prettier.config.{js,cjs,mjs}',
  'package.json',
];

const findPrettierDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const localConfig: PrettierConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.prettier : await load(configFilePath);

  // https://prettier.io/docs/en/configuration.html#sharing-configurations
  if (typeof localConfig === 'string') {
    return [localConfig];
  }

  return localConfig && Array.isArray(localConfig.plugins)
    ? localConfig.plugins.filter((plugin): plugin is string => typeof plugin === 'string')
    : [];
};

const findDependencies = timerify(findPrettierDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

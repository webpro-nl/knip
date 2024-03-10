import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { PrettierConfig } from './types.js';

// https://prettier.io/docs/en/configuration.html

const title = 'Prettier';

const enablers = ['prettier'];

const isEnabled: IsPluginEnabled = ({ dependencies, config }) =>
  hasDependency(dependencies, enablers) || 'prettier' in config;

const config = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,yml,yaml}',
  'prettier.config.{js,cjs,mjs}',
  'package.json',
];

const resolveConfig: ResolveConfig<PrettierConfig> = config => {
  if (typeof config === 'string') {
    return [config];
  }

  return Array.isArray(config.plugins)
    ? config.plugins.filter((plugin): plugin is string => typeof plugin === 'string')
    : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;

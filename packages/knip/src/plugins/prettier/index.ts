import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import type { PrettierConfig } from './types.js';

// https://prettier.io/docs/en/configuration.html
// https://github.com/prettier/prettier/blob/main/src/config/prettier-config/config-searcher.js

const title = 'Prettier';

const enablers = ['prettier'];

const isEnabled: IsPluginEnabled = ({ dependencies, config }) =>
  hasDependency(dependencies, enablers) || 'prettier' in config;

const config = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,yml,yaml,toml,json5}',
  'prettier.config.{js,cjs,mjs}',
  'package.{json,yaml}',
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
} satisfies Plugin;

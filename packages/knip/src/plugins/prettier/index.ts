import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
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
  if (typeof config === 'string') return [toDeferResolve(config)];

  return Array.isArray(config.plugins)
    ? config.plugins.filter((plugin): plugin is string => typeof plugin === 'string').map(id => toDependency(id))
    : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

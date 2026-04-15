import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PrettierConfig } from './types.ts';

// https://prettier.io/docs/en/configuration.html
// https://github.com/prettier/prettier/blob/main/src/config/prettier-config/config-searcher.js

const title = 'Prettier';

const enablers = ['prettier'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  '.prettierrc',
  '.prettierrc.{json,js,cjs,mjs,ts,cts,mts,yml,yaml,toml,json5}',
  'prettier.config.{js,cjs,mjs,ts,cts,mts}',
  'package.{json,yaml}',
];

const resolveConfig: ResolveConfig<PrettierConfig> = config => {
  if (typeof config === 'string') return [toDeferResolve(config)];

  return Array.isArray(config.plugins)
    ? config.plugins.filter((plugin): plugin is string => typeof plugin === 'string').map(id => toDependency(id))
    : [];
};

const isFilterTransitiveDependencies = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  isFilterTransitiveDependencies,
};

export default plugin;

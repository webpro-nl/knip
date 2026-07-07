import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDeferResolve, toDependency, type Input } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { PrettierConfig, PrettierOptions } from './types.ts';

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

  const result = new Set<Input>();

  const processOptions = (options: PrettierOptions) => {
    if (Array.isArray(options.plugins)) {
      for (const plugin of options.plugins) {
        if (typeof plugin === 'string') {
          result.add(toDependency(plugin));
        }
      }
    }
  };

  processOptions(config);
  if (config.overrides) {
    for (const override of config.overrides) {
      if (override.options) {
        processOptions(override.options);
      }
    }
  }

  return Array.from(result);
};

const args: Args = {
  config: true,
};

const isFilterTransitiveDependencies = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  args,
  resolveConfig,
  isFilterTransitiveDependencies,
};

export default plugin;

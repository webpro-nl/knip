import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toConfig, toDeferResolve } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { StrykerConfig } from './types.ts';

// https://stryker-mutator.io/docs/stryker-js/config-file/

const title = 'Stryker';

const enablers = ['@stryker-mutator/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['?(.)stryker.{conf,config}.{js,mjs,cjs,json}'];

const resolveConfig: ResolveConfig<StrykerConfig> = localConfig => {
  const runners = localConfig.testRunner ? [`@stryker-mutator/${localConfig.testRunner}-runner`] : [];
  const checkers = localConfig.checkers
    ? localConfig.checkers.map(checker => `@stryker-mutator/${checker}-checker`)
    : [];
  const plugins = localConfig.plugins ?? [];

  return [...runners, ...checkers, ...plugins].map(id => toDeferResolve(id));
};

const args: Args = {
  boolean: ['allowEmpty', 'disableBail', 'dryRunOnly', 'force', 'ignoreStatic', 'incremental', 'inPlace'],
  resolveInputs: parsed => (parsed._[0] === 'run' && parsed._[1] ? [toConfig('stryker', parsed._[1])] : []),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;

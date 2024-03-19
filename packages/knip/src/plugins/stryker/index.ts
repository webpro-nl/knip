import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { StrykerConfig } from './types.js';

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

  return [...runners, ...checkers, ...plugins];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;

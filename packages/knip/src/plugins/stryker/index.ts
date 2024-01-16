import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { StrykerConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://stryker-mutator.io/docs/stryker-js/config-file/

const NAME = 'Stryker';

const ENABLERS = ['@stryker-mutator/core'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['?(.)stryker.{conf,config}.{js,mjs,cjs,json}'];

const findStrykerDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  const localConfig: StrykerConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  const runners = localConfig.testRunner ? [`@stryker-mutator/${localConfig.testRunner}-runner`] : [];
  const checkers = localConfig.checkers
    ? localConfig.checkers.map(checker => `@stryker-mutator/${checker}-checker`)
    : [];
  const plugins = localConfig.plugins ?? [];

  return [...runners, ...checkers, ...plugins];
};

const findDependencies = timerify(findStrykerDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

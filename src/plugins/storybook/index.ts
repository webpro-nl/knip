import { timerify } from '../../util/performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { StorybookConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://storybook.js.org/docs/react/configure/overview

export const NAME = 'Storybook';

/** @public */
export const ENABLERS = [/^@storybook\//, '@nrwl/storybook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.storybook/{main,manager}.{js,ts}'];

export const ENTRY_FILE_PATTERNS = ['.storybook/preview.{js,jsx,ts,tsx}', '**/*.stories.{js,jsx,ts,tsx}'];

export const PROJECT_FILE_PATTERNS = ['.storybook/**/*.{js,jsx,ts,tsx}'];

const findStorybookDependencies: GenericPluginCallback = async configFilePath => {
  const config: StorybookConfig = await load(configFilePath);

  if (!config) return [];

  const addons = config.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
  const builder = config?.core?.builder;
  const builderPackages =
    builder && /webpack/.test(builder) ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`] : [];

  return [...addons, ...builderPackages];
};

export const findDependencies = timerify(findStorybookDependencies);

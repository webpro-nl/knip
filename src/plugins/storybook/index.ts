import { createRequire } from 'node:module';
import path from 'node:path';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { StorybookConfig } from './types.js';

// https://storybook.js.org/docs/react/configure/overview

const require = createRequire(process.cwd());

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('@storybook/core') || dependencies.has('@nrwl/storybook');
};

export const CONFIG_FILE_PATTERNS = ['.storybook/{main,manager}.{js,ts}'];

export const ENTRY_FILE_PATTERNS = ['.storybook/preview.{js,jsx,ts,tsx}', '**/*.stories.{js,jsx,ts,tsx}'];

export const PROJECT_FILE_PATTERNS = ['.storybook/**/*.{js,ts,tsx}'];

const findStorybookDependencies: GenericPluginCallback = async configFilePath => {
  const config: StorybookConfig = await _load(configFilePath);
  if (config) {
    const addons =
      config.addons?.map(addon =>
        addon.startsWith('.') ? require.resolve(path.join(path.dirname(configFilePath), addon)) : addon
      ) ?? [];
    const builder = config?.core?.builder;
    const builderPackages =
      builder && /webpack/.test(builder) ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`] : [];
    return [...addons, ...builderPackages].map(getPackageName);
  }
  return [];
};

export const findDependencies = timerify(findStorybookDependencies);

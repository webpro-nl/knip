import { dirname, join, relative } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { StorybookConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://storybook.js.org/docs/react/configure/overview

export const NAME = 'Storybook';

/** @public */
export const ENABLERS = [/^@storybook\//, '@nrwl/storybook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.storybook/{main,test-runner}.{js,ts}'];

/** @public */
export const STORIES_FILE_PATTERNS = ['**/*.stories.{js,jsx,ts,tsx}'];

/** @public */
export const ENTRY_FILE_PATTERNS = ['.storybook/{manager,preview}.{js,jsx,ts,tsx}', ...STORIES_FILE_PATTERNS];

export const PROJECT_FILE_PATTERNS = ['.storybook/**/*.{js,jsx,ts,tsx}'];

const findStorybookDependencies: GenericPluginCallback = async (configFilePath, { isProduction, config }) => {
  const cfg: StorybookConfig = await load(configFilePath);

  const stories = (typeof cfg.stories === 'function' ? await cfg.stories(STORIES_FILE_PATTERNS) : cfg.stories)?.map(
    pattern => relative(join(dirname(configFilePath), pattern))
  );
  const cfgPatterns = [...(config?.entry ?? []), ...(stories ?? [])];
  const entryPatterns = (cfgPatterns.length > 0 ? cfgPatterns : ENTRY_FILE_PATTERNS).map(toEntryPattern);

  if (isProduction) return entryPatterns;

  if (!cfg) return [];

  const addons = cfg.addons?.map(addon => (typeof addon === 'string' ? addon : addon.name)) ?? [];
  const builder = cfg?.core?.builder;
  const builderPackages =
    builder && /webpack/.test(builder) ? [`@storybook/builder-${builder}`, `@storybook/manager-${builder}`] : [];
  const frameworks = cfg.framework?.name ? [cfg.framework.name] : [];

  return [...entryPatterns, ...addons, ...builderPackages, ...frameworks];
};

export const findDependencies = timerify(findStorybookDependencies);

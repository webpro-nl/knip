import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://orm.drizzle.team/kit-docs/overview

export const NAME = 'Drizzle';

/** @public */
export const ENABLERS = ['drizzle-kit'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['drizzle.config.{ts,js,json}'];

const findDrizzleDependencies: GenericPluginCallback = async () => {
  return [];
};

export const findDependencies = timerify(findDrizzleDependencies);

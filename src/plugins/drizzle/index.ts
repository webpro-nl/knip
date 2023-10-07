import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { DrizzleConfig } from './types.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://orm.drizzle.team/kit-docs/overview

export const NAME = 'Drizzle';

/** @public */
export const ENABLERS = ['drizzle-kit'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['drizzle.config.{ts,js,json}'];

const findDrizzleDependencies: GenericPluginCallback = async configFilePath => {
  const config: DrizzleConfig = await load(configFilePath);
  if (!config || !config.schema) return [];
  return [config.schema].flat().map(toEntryPattern);
};

export const findDependencies = timerify(findDrizzleDependencies);

import { _glob } from '../../util/glob.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { DrizzleConfig } from './types.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://orm.drizzle.team/kit-docs/overview

export const NAME = 'Drizzle';

/** @public */
export const ENABLERS = ['drizzle-kit'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['drizzle.config.{ts,js,json}'];

const findDrizzleDependencies: GenericPluginCallback = async (configFilePath, { cwd }) => {
  const config: DrizzleConfig = await load(configFilePath);
  if (!config || !config.schema) return [];
  const patterns = Array.isArray(config.schema) ? config.schema : [config.schema];
  const paths = await _glob({ cwd, patterns });
  return paths;
};

export const findDependencies = timerify(findDrizzleDependencies);

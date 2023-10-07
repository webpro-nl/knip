import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://www.npmjs.com/package/nyc

type NycConfig = {
  extends: string;
};

export const NAME = 'nyc';

/** @public */
export const ENABLERS = ['nyc'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.nycrc', '.nycrc.json', '.nycrc.{yml,yaml}', 'nyc.config.js'];

const findNycDependencies: GenericPluginCallback = async (configFilePath, { isProduction }) => {
  if (isProduction) return [];
  const config: NycConfig = await load(configFilePath);
  return config.extends ? [config.extends].flat() : [];
};

export const findDependencies = timerify(findNycDependencies);

import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
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

const findNycDependencies: GenericPluginCallback = async configFilePath => {
  const config: NycConfig = await _load(configFilePath);
  return [config.extends];
};

export const findDependencies = timerify(findNycDependencies);

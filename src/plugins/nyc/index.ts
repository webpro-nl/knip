import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://www.npmjs.com/package/nyc

type NycConfig = {
  extends: string;
};

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('nyc');

export const CONFIG_FILE_PATTERNS = ['.nycrc', '.nycrc.json', '.nycrc.{yml,yaml}', 'nyc.config.js'];

const findNycDependencies: GenericPluginCallback = async configFilePath => {
  const config: NycConfig = await _load(configFilePath);
  return [config.extends];
};

export const findDependencies = timerify(findNycDependencies);

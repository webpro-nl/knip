import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

type RemarkConfig = {
  plugins: string[];
};

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('remark-cli');

export const CONFIG_FILE_PATTERNS = ['package.json'];

const findRemarkDependencies: GenericPluginCallback = async (configFilePath, { manifest }) => {
  if (configFilePath.endsWith('package.json')) {
    return (manifest?.remarkConfig as RemarkConfig)?.plugins?.map(plugin => `remark-${plugin}`) ?? [];
  }
  return [];
};

export const findDependencies = timerify(findRemarkDependencies);

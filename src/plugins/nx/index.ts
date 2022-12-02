import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

interface ProjectConfiguration {
  targets?: {
    [targetName: string]: {
      executor?: string;
    };
  };
}

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => {
  return dependencies.has('@nrwl/workspace');
};

export const CONFIG_FILE_PATTERNS = ['{apps,libs}/**/project.json'];

const findNxDependencies: GenericPluginCallback = async configFilePath => {
  const config: ProjectConfiguration = await _load(configFilePath);
  const { targets } = config;
  const executors = targets ? Object.values(targets).map(target => target?.executor) : [];
  return compact(
    executors.filter(executor => executor && !executor.startsWith('.')).map(executor => executor?.split(':')[0])
  );
};

export const findDependencies = timerify(findNxDependencies);

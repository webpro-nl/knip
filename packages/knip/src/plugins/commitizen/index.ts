import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { CommitizenConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/commitizen/cz-cli

const NAME = 'Commitizen';

const ENABLERS = ['commitizen'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'config.commitizen';

const CONFIG_FILE_PATTERNS = ['.czrc', '.cz.json', 'package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const localConfig: CommitizenConfig | undefined =
    // @ts-expect-error TODO
    basename(configFilePath) === 'package.json' ? manifest.config?.commitizen : await load(configFilePath);

  if (!localConfig) return [];

  return localConfig.path ? [localConfig.path] : [];
};

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

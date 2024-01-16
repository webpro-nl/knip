import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/changesets/changesets/blob/main/docs/config-file-options.md

type ChangesetsConfig = {
  changelog: string | string[];
};

const NAME = 'Changesets';

const ENABLERS = ['@changesets/cli'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['.changeset/config.json'];

const findChangesetsDependencies: GenericPluginCallback = async (configFilePath, { isProduction }) => {
  if (isProduction) return [];

  const localConfig: ChangesetsConfig | undefined = await load(configFilePath);

  if (!localConfig) return [];

  return Array.isArray(localConfig.changelog)
    ? [localConfig.changelog[0]]
    : typeof localConfig.changelog === 'string'
      ? [localConfig.changelog]
      : [];
};

const findDependencies = timerify(findChangesetsDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

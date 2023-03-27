import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/changesets/changesets/blob/main/docs/config-file-options.md

type ChangesetsConfig = {
  changelog: string | string[];
};

export const NAME = 'Changesets';

/** @public */
export const ENABLERS = ['@changesets/cli'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['.changeset/config.json'];

const findChangesetsDependencies: GenericPluginCallback = async configFilePath => {
  const config: ChangesetsConfig = await load(configFilePath);
  return Array.isArray(config.changelog)
    ? [config.changelog[0]]
    : typeof config.changelog === 'string'
    ? [config.changelog]
    : [];
};

export const findDependencies = timerify(findChangesetsDependencies);

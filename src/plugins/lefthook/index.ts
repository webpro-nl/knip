import { _getReferencesFromScripts } from '../../binaries/index.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/evilmartians/lefthook

export const NAME = 'Lefthook';

/** @public */
export const ENABLERS = ['lefthook', '@arkweid/lefthook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['lefthook.yml'];

const findLefthookDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, workspaceConfig }) => {
  const config = await load(configFilePath);

  if (!config) return [];

  const scripts = getValuesByKeyDeep(config, 'run').filter((value): value is string => typeof value === 'string');

  const { binaries, entryFiles } = _getReferencesFromScripts(scripts, {
    cwd,
    manifest,
    ignore: workspaceConfig.ignoreBinaries,
    knownGlobalsOnly: true,
  });

  return [...binaries, ...entryFiles];
};

export const findDependencies = timerify(findLefthookDependencies);

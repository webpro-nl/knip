import { _getReferencesFromScripts } from '../../util/binaries/index.js';
import { _load } from '../../util/loader.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { timerify } from '../../util/performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/evilmartians/lefthook

export const NAME = 'Lefthook';

/** @public */
export const ENABLERS = ['lefthook', '@arkweid/lefthook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['lefthook.yml'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, rootConfig }) => {
  const config = await _load(configFilePath);

  if (!config) return [];

  const scripts = getValuesByKeyDeep(config, 'run').filter((value): value is string => typeof value === 'string');

  const { binaries, entryFiles } = _getReferencesFromScripts(scripts, {
    cwd,
    manifest,
    ignore: rootConfig.ignoreBinaries,
    knownGlobalsOnly: true,
  });

  return { dependencies: binaries, entryFiles };
};

export const findDependencies = timerify(findPluginDependencies);

import { readFileSync } from 'fs';
import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { fromBinary } from '../../binaries/util.js';
import { getGitHookPaths } from '../../util/git.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/evilmartians/lefthook

export const NAME = 'Lefthook';

/** @public */
export const ENABLERS = ['lefthook', '@arkweid/lefthook'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHookPaths = getGitHookPaths();

export const CONFIG_FILE_PATTERNS = ['lefthook.yml', ...gitHookPaths];

const findLefthookDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  if (configFilePath.endsWith('.yml')) {
    const config = await load(configFilePath);
    if (!config) return [];
    const scripts = getValuesByKeyDeep(config, 'run').filter((value): value is string => typeof value === 'string');
    return _getDependenciesFromScripts(scripts, { cwd, manifest, knownGlobalsOnly: true });
  }

  const script = readFileSync(configFilePath, 'utf8');
  const scriptDependencies = _getDependenciesFromScripts([script], { cwd, manifest, knownGlobalsOnly: false });
  const dependencies = manifest.devDependencies ? Object.keys(manifest.devDependencies) : [];
  const matches = scriptDependencies.find(dep => dependencies.includes(fromBinary(dep)));
  return matches ? [matches] : [];
};

export const findDependencies = timerify(findLefthookDependencies);

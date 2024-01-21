import { getGitHookPaths } from '../../util/git.js';
import { getValuesByKeyDeep } from '../../util/object.js';
import { extname } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, load, loadFile } from '../../util/plugin.js';
import { fromBinary } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/evilmartians/lefthook

const NAME = 'Lefthook';

const ENABLERS = ['lefthook', '@arkweid/lefthook', '@evilmartians/lefthook'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHookPaths = getGitHookPaths();

const CONFIG_FILE_PATTERNS = ['lefthook.yml', ...gitHookPaths];

const findLefthookDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const dependencies = manifest.devDependencies ? Object.keys(manifest.devDependencies) : [];

  if (extname(configFilePath) === '.yml') {
    const localConfig = await load(configFilePath);
    if (!localConfig) return [];
    const scripts = getValuesByKeyDeep(localConfig, 'run').filter((run): run is string => typeof run === 'string');
    const lefthook = process.env.CI ? ENABLERS.filter(dependency => dependencies.includes(dependency)) : [];
    return [...lefthook, ...getDependenciesFromScripts(scripts, { ...options, knownGlobalsOnly: true })];
  }

  const script = await loadFile(configFilePath);

  if (!script) return [];

  const scriptDependencies = getDependenciesFromScripts([script], options);
  const matches = scriptDependencies.find(dep => dependencies.includes(fromBinary(dep)));
  return matches ? [matches] : [];
};

const findDependencies = timerify(findLefthookDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

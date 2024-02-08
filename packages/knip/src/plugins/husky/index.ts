import { getGitHookPaths } from '../../util/git.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, loadFile } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typicode.github.io/husky

const NAME = 'husky';

const ENABLERS = ['husky'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHookPaths = getGitHookPaths('.husky');

const CONFIG_FILE_PATTERNS = [...gitHookPaths];

const findHuskyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  const script = await loadFile(configFilePath);

  if (!script) return [];

  return getDependenciesFromScripts(String(script), { ...options, knownGlobalsOnly: true });
};

const findDependencies = timerify(findHuskyDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

import { readFileSync } from 'fs';
import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { getGitHookPaths } from '../../util/git.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typicode.github.io/husky
// https://git-scm.com/docs/githooks

export const NAME = 'husky';

/** @public */
export const ENABLERS = ['husky'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHookPaths = getGitHookPaths('.husky');

export const CONFIG_FILE_PATTERNS = [...gitHookPaths];

const findHuskyDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest, isProduction }) => {
  if (isProduction) return [];

  const script = readFileSync(configFilePath);

  return _getDependenciesFromScripts(String(script), {
    cwd,
    manifest,
    knownGlobalsOnly: true,
  });
};

export const findDependencies = timerify(findHuskyDependencies);

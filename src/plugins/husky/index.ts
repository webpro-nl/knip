import { readFileSync } from 'fs';
import { _getDependenciesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { getGitHooksPath } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typicode.github.io/husky
// https://git-scm.com/docs/githooks

export const NAME = 'husky';

/** @public */
export const ENABLERS = ['husky'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const gitHooksPath = getGitHooksPath();

// TODO More hooks exists, but is it worth adding all of them?
export const CONFIG_FILE_PATTERNS = [
  `${gitHooksPath}/prepare-commit-msg`,
  `${gitHooksPath}/commit-msg`,
  `${gitHooksPath}/pre-{applypatch,commit,merge-commit,push,rebase,receive}`,
  `${gitHooksPath}/post-{checkout,commit,merge,rewrite}`,
];

const findHuskyDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  const script = readFileSync(configFilePath);

  return _getDependenciesFromScripts(String(script), {
    cwd,
    manifest,
    knownGlobalsOnly: true,
  });
};

export const findDependencies = timerify(findHuskyDependencies);

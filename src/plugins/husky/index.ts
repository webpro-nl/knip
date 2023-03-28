import { readFileSync } from 'fs';
import { _getReferencesFromScripts } from '../../binaries/index.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typicode.github.io/husky
// https://git-scm.com/docs/githooks

export const NAME = 'husky';

/** @public */
export const ENABLERS = ['husky'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

// TODO More hooks exists, but is it worth adding all of them?
export const CONFIG_FILE_PATTERNS = [
  '.husky/commit-msg',
  '.husky/pre-{applypatch,commit,merge-commit,push,rebase,receive}',
  '.husky/post-{checkout,commit,merge,rewrite}',
];

const findHuskyDependencies: GenericPluginCallback = async (configFilePath, { cwd, manifest }) => {
  const script = readFileSync(configFilePath);

  const { binaries, entryFiles } = _getReferencesFromScripts(String(script), {
    cwd,
    manifest,
    knownGlobalsOnly: true,
  });

  return [...binaries, ...entryFiles];
};

export const findDependencies = timerify(findHuskyDependencies);

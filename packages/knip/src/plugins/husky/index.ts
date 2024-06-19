import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/plugins.js';
import { getGitHookPaths } from '../../util/git.js';
import { getDependenciesFromScripts, hasDependency } from '../../util/plugin.js';

// https://typicode.github.io/husky

const title = 'husky';

const enablers = ['husky'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

// husky v9 registers hooks in .husky/_/, so need to set "false" here to get same lookup as in v8
const gitHookPaths = getGitHookPaths('.husky', false);

// Add patterns for both v8 and v9 because we can't know which version is installed at this point
const config = [...gitHookPaths];

const resolveConfig: ResolveConfig<string> = async (script, options) => {
  if (!script) return [];

  return getDependenciesFromScripts(String(script), { ...options, knownGlobalsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

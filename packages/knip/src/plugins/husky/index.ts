import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { getGitHookPaths } from '../../util/git.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://typicode.github.io/husky

const title = 'husky';

const enablers = ['husky'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

// husky v9 registers hooks in .husky/_/, so need to set "false" here to get same lookup as in v8
const gitHookPaths = getGitHookPaths('.husky', false);

// Add patterns for both v8 and v9 because we can't know which version is installed at this point
const config = [...gitHookPaths, 'package.json'];

const resolveConfig: ResolveConfig = (script, options) => {
  if (!script) return [];

  if (options.configFileName === 'package.json') {
    const hooks = script.hooks;
    if (hooks) {
      const scripts: string[] = Object.values(hooks);
      return [toDependency('husky'), ...options.getInputsFromScripts(scripts, { ...options })];
    }
  }

  return options.getInputsFromScripts(String(script), { knownBinsOnly: true });
};

export default {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
} satisfies Plugin;

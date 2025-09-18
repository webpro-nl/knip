import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { getGitHookPaths } from '../../util/git.js';
import { fromBinary, toDependency } from '../../util/input.js';
import { findByKeyDeep } from '../../util/object.js';
import { extname } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/evilmartians/lefthook

const title = 'Lefthook';

const enablers = ['lefthook', '@arkweid/lefthook', '@evilmartians/lefthook'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const gitHookPaths = getGitHookPaths();

const config = ['lefthook.yml', ...gitHookPaths];

type Command = {
  run: string;
  root: string;
};

const resolveConfig: ResolveConfig = async (localConfig, options) => {
  if (options.isProduction) return [];

  const { manifest, configFileName, cwd, getInputsFromScripts } = options;

  const inputs = manifest.devDependencies ? Object.keys(manifest.devDependencies).map(id => toDependency(id)) : [];

  if (extname(configFileName) === '.yml') {
    const scripts = findByKeyDeep<Command>(localConfig, 'run').flatMap(command => {
      const deps = getInputsFromScripts([command.run], { ...options, knownBinsOnly: true });
      const dir = command.root ?? cwd;
      return deps.flatMap(dependency => ({ ...dependency, dir }));
    });

    const lefthook = process.env.CI
      ? enablers.filter(dependency => inputs.some(d => d.specifier === dependency)).map(id => toDependency(id))
      : [];

    return [...scripts, ...lefthook];
  }

  const script = localConfig;

  if (!script) return [];

  const scriptInputs = getInputsFromScripts(script);
  const matches = scriptInputs.find(dep => inputs.some(d => d.specifier === fromBinary(dep)));
  return matches ? [matches] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

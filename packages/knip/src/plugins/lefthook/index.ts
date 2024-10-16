import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { fromBinary, toDependency } from '../../util/dependencies.js';
import { getGitHookPaths } from '../../util/git.js';
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
  const { manifest, configFileName, cwd, getDependenciesFromScripts } = options;

  const dependencies = manifest.devDependencies ? Object.keys(manifest.devDependencies).map(toDependency) : [];

  if (extname(configFileName) === '.yml') {
    const scripts = findByKeyDeep<Command>(localConfig, 'run').flatMap(command => {
      const deps = getDependenciesFromScripts([command.run], { ...options, knownGlobalsOnly: true });
      const dir = command.root ?? cwd;
      return deps.flatMap(dependency => ({ ...dependency, dir }));
    });

    const lefthook = process.env.CI
      ? enablers.filter(dependency => dependencies.some(d => d.specifier === dependency)).map(toDependency)
      : [];

    return [...scripts, ...lefthook];
  }

  const script = localConfig;

  if (!script) return [];

  const scriptDependencies = getDependenciesFromScripts(script);
  const matches = scriptDependencies.find(dep => dependencies.some(d => d.specifier === fromBinary(dep)));
  return matches ? [matches] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

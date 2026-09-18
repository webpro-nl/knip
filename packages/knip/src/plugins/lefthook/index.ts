import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { getGitHookPaths } from '../../util/git.ts';
import { fromBinary, toDependency } from '../../util/input.ts';
import { findByKeyDeep } from '../../util/object.ts';
import { extname } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/evilmartians/lefthook
// https://lefthook.dev/configuration/#config-file-name

const title = 'Lefthook';

const enablers = ['lefthook', '@arkweid/lefthook', '@evilmartians/lefthook'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const configFiles = [
  'lefthook.{yml,yaml,json,jsonc,toml}',
  '.lefthook.{yml,yaml,json,jsonc,toml}',
  '.config/lefthook.{yml,yaml,json,jsonc,toml}',
  'lefthook-local.{yml,yaml,json,jsonc,toml}',
  '.lefthook-local.{yml,yaml,json,jsonc,toml}',
  '.config/lefthook-local.{yml,yaml,json,jsonc,toml}',
];

type Command = {
  run: string;
  root: string;
};

const resolveConfig: ResolveConfig = async (localConfig, options) => {
  if (options.isProduction) return [];

  const { manifest, configFileName, cwd, getInputsFromScripts } = options;

  const inputs = manifest.devDependencies ? Object.keys(manifest.devDependencies).map(id => toDependency(id)) : [];

  if (extname(configFileName) !== '') {
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

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config: options => [...configFiles, ...getGitHookPaths('.git/hooks', true, options.cwd)],
  resolveConfig,
};

export default plugin;

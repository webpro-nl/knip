import { getGitHookPaths } from '#p/util/git.js';
import { getValuesByKeyDeep } from '#p/util/object.js';
import { extname } from '#p/util/path.js';
import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import { fromBinary } from '#p/util/protocols.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';

// https://github.com/evilmartians/lefthook

const title = 'Lefthook';

const enablers = ['lefthook', '@arkweid/lefthook', '@evilmartians/lefthook'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const gitHookPaths = getGitHookPaths();

const config = ['lefthook.yml', ...gitHookPaths];

const resolveConfig: ResolveConfig = async (localConfig, options) => {
  const { manifest, isProduction, configFileName } = options;

  if (isProduction) return [];

  const dependencies = manifest.devDependencies ? Object.keys(manifest.devDependencies) : [];

  if (extname(configFileName) === '.yml') {
    const scripts = getValuesByKeyDeep(localConfig, 'run').filter((run): run is string => typeof run === 'string');
    const lefthook = process.env.CI ? enablers.filter(dependency => dependencies.includes(dependency)) : [];
    return [...lefthook, ...getDependenciesFromScripts(scripts, { ...options, knownGlobalsOnly: true })];
  }

  const script = localConfig;

  if (!script) return [];

  const scriptDependencies = getDependenciesFromScripts(script, options);
  const matches = scriptDependencies.find(dep => dependencies.includes(fromBinary(dep)));
  return matches ? [matches] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

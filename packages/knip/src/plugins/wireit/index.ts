import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { WireitConfig } from './types.js';

// https://github.com/google/wireit

const title = 'Wireit';

const enablers = ['wireit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'wireit';

const config = ['package.json'];

const resolveConfig: ResolveConfig<WireitConfig> = (localConfig, options) => {
  const scripts = Object.values(localConfig).flatMap(({ command: script }) => (script ? [script] : []));

  const scriptDependencies = getDependenciesFromScripts(scripts, options);

  return scriptDependencies;
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} as const;

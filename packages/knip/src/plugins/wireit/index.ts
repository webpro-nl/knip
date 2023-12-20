import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/google/wireit

export const NAME = 'Wireit';

/** @public */
export const ENABLERS = ['wireit'];

export const PACKAGE_JSON_PATH = 'wireit';

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['package.json'];

const findWireitDependencies: GenericPluginCallback = async (_configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig = manifest[PACKAGE_JSON_PATH];
  if (!localConfig) return [];

  const scriptArray = Object.values(localConfig)
    .map(({ command }) => command)
    .filter(script => script !== undefined);

  const scriptDependencies = getDependenciesFromScripts(scriptArray, { cwd, manifest, knownGlobalsOnly: false });

  return scriptDependencies;
};

export const findDependencies = timerify(findWireitDependencies);

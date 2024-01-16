import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency } from '../../util/plugin.js';
import type { WireitConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/google/wireit

const NAME = 'Wireit';

const ENABLERS = ['wireit'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'wireit';

const CONFIG_FILE_PATTERNS = ['package.json'];

const findWireItDependencies: GenericPluginCallback = async (_configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig = manifest[PACKAGE_JSON_PATH] as WireitConfig;
  if (!localConfig) return [];

  const scripts = Object.values(localConfig).flatMap(({ command: script }) => (script ? [script] : []));

  const scriptDependencies = getDependenciesFromScripts(scripts, { cwd, manifest });

  return scriptDependencies;
};

const findDependencies = timerify(findWireItDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

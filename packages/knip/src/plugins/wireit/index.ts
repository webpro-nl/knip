import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency } from '../../util/plugin.js';
import type { WireitConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/google/wireit

export const NAME = 'Wireit';

/** @public */
export const ENABLERS = ['wireit'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['package.json'];

/** @public */
export const ENTRY_FILE_PATTERNS = [];

/** @public */
export const PRODUCTION_ENTRY_FILE_PATTERNS = [];

export const PROJECT_FILE_PATTERNS = [];

export const PACKAGE_JSON_PATH = 'wireit';

const findWireItDependencies: GenericPluginCallback = async (_configFilePath, options) => {
  const { cwd, manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig = manifest[PACKAGE_JSON_PATH] as WireitConfig;
  if (!localConfig) return [];

  const scripts = Object.values(localConfig).flatMap(({ command: script }) => (script ? [script] : []));

  const scriptDependencies = getDependenciesFromScripts(scripts, { cwd, manifest });

  return scriptDependencies;
};

export const findDependencies = timerify(findWireItDependencies);

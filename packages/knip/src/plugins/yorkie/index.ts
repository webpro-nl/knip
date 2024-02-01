import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://github.com/yyx990803/yorkie

const NAME = 'yorkie';

const ENABLERS = ['yorkie'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PACKAGE_JSON_PATH = 'gitHooks';

const CONFIG_FILE_PATTERNS = ['package.json'];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig = manifest[PACKAGE_JSON_PATH];

  if (!localConfig) return [];

  const dependencies = new Set<string>();

  for (const script of Object.values(localConfig).flat()) {
    const scripts = [script].flat();
    getDependenciesFromScripts(scripts, options).forEach(identifier => dependencies.add(identifier));
  }

  // Looks like the idea is to have lint-staged installed too, so there are no refs to yorkie
  return ['yorkie', ...dependencies];
};

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PACKAGE_JSON_PATH,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

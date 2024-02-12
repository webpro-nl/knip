import { compact } from '../../util/array.js';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, load } from '../../util/plugin.js';
import type { NxConfigRoot, NxProjectConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

const NAME = 'Nx';

const ENABLERS = ['nx', /^@nrwl\//, /^@nx\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['nx.json', 'project.json', '{apps,libs}/**/project.json'];

const findNxDependenciesInNxJson: GenericPluginCallback = async configFilePath => {
  const localConfig: NxConfigRoot | undefined = await load(configFilePath);

  if (!localConfig) return [];

  const targetsDefault = localConfig.targetDefaults
    ? Object.keys(localConfig.targetDefaults)
        // Ensure we only grab executors from plugins instead of manual targets
        // Limiting to scoped packages to ensure we don't have false positives
        .filter(it => it.includes(':') && it.startsWith('@'))
        .map(it => it.split(':')[0])
    : [];

  const plugins =
    localConfig.plugins && Array.isArray(localConfig.plugins)
      ? localConfig.plugins
          .map(item => (typeof item === 'string' ? item : item.plugin))
          .map(it => getPackageNameFromModuleSpecifier(it))
          .filter(value => value !== undefined)
      : [];
  const generators = localConfig.generators
    ? Object.keys(localConfig.generators)
        .map(it => getPackageNameFromModuleSpecifier(it))
        .filter(value => value !== undefined)
    : [];

  return compact([...targetsDefault, ...plugins, ...generators]);
};

const findNxDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  if (configFilePath.endsWith('nx.json')) {
    return findNxDependenciesInNxJson(configFilePath, options);
  }

  const localConfig: NxProjectConfiguration | undefined = await load(configFilePath);

  if (!localConfig) return [];

  const targets = localConfig.targets ? Object.values(localConfig.targets) : [];

  const executors = targets
    .map(target => target?.executor)
    .filter(executor => executor && !executor.startsWith('.'))
    .map(executor => executor?.split(':')[0]);
  const scripts = targets
    .filter(target => target.executor === 'nx:run-commands')
    .flatMap(target => target.options?.commands ?? (target.options?.command ? [target.options.command] : []));
  const dependencies = getDependenciesFromScripts(scripts, options);

  return compact([...executors, ...dependencies]);
};

const findDependencies = timerify(findNxDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

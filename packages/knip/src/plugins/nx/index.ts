import { compact } from '#p/util/array.js';
import { getPackageNameFromModuleSpecifier } from '#p/util/modules.js';
import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, ResolveConfig } from '#p/types/plugins.js';
import type { NxConfigRoot, NxProjectConfiguration } from './types.js';

const title = 'Nx';

const enablers = ['nx', /^@nrwl\//, /^@nx\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nx.json', 'project.json', '{apps,libs}/**/project.json'];

const findNxDependenciesInNxJson: ResolveConfig<NxConfigRoot> = async localConfig => {
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

const resolveConfig: ResolveConfig<NxProjectConfiguration | NxConfigRoot> = async (localConfig, options) => {
  const { configFileName } = options;

  if (configFileName === 'nx.json') {
    return findNxDependenciesInNxJson(localConfig as NxConfigRoot, options);
  }

  const config = localConfig as NxProjectConfiguration;

  const targets = config.targets ? Object.values(config.targets) : [];

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

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

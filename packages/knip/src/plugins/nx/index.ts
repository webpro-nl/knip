import type { ParsedArgs } from 'minimist';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { NxConfigRoot, NxProjectConfiguration } from './types.js';

const title = 'Nx';

const enablers = ['nx', /^@nrwl\//, /^@nx\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['nx.json', 'project.json', '{apps,libs}/**/project.json', 'package.json'];

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
          .map(value => (typeof value === 'string' ? value : value.plugin))
          .filter(value => value !== undefined)
      : [];

  const generators = localConfig.generators
    ? Object.keys(localConfig.generators)
        .filter(value => value !== undefined)
        .map(value => value.split(':')[0])
    : [];

  return compact([...targetsDefault, ...plugins, ...generators]).map(id => toDependency(id));
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
    .filter(target => target.executor === 'nx:run-commands' || target.command)
    .flatMap(target => {
      if (target.command) return [target.command];
      if (target.options?.command) return [target.options.command];
      if (target.options?.commands) return target.options.commands;
      return [];
    });

  const inputs = options.getInputsFromScripts(scripts);

  return compact([...executors, ...inputs]).map(id => (typeof id === 'string' ? toDependency(id) : id));
};

const args = {
  fromArgs: (parsed: ParsedArgs) => (parsed._[0] === 'exec' ? parsed._.slice(1) : []),
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
} satisfies Plugin;

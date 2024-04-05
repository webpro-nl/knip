import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import type { MoonConfiguration } from './types.js';

// link to moonrepo docs: https://moonrepo.dev/docs

const title = 'moonrepo';

const enablers: EnablerPatterns = ['@moonrepo/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['moon.yml', '.moon/tasks.yml', '.moon/tasks/*.yml'];

const resolveConfig: ResolveConfig<MoonConfiguration> = async (config, options) => {
  const tasks = config.tasks ? Object.values(config.tasks) : [];
  const dependencies = tasks
    .map(task => task.command)
    .filter(command => command)
    .map(command => command.replace('$workspaceRoot', options.rootCwd!))
    .map(command => command.replace('$projectRoot', options.cwd))
    .flatMap(command => getDependenciesFromScripts(command, options));
  return [...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

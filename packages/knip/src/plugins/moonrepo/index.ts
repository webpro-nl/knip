import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MoonConfiguration } from './types.ts';

// https://moonrepo.dev/docs

const title = 'moonrepo';

const enablers = ['@moonrepo/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const config = ['moon.yml', '.moon/tasks.yml', '.moon/tasks/*.yml'];

const resolveConfig: ResolveConfig<MoonConfiguration> = async (config, options) => {
  const tasks = config.tasks ? Object.values(config.tasks) : [];
  const inputs = tasks
    .map(task => task.command)
    .filter(command => command)
    .map(command => (Array.isArray(command) ? command.join(' ') : command))
    .map(command => command.replace('$workspaceRoot', options.rootCwd))
    .map(command => command.replace('$projectRoot', options.cwd))
    .flatMap(command => options.getInputsFromScripts(command));
  return [...inputs];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  isRootOnly,
  config,
  resolveConfig,
};

export default plugin;

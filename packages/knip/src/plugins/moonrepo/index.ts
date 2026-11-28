import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { relative } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toShellCommand } from '../../util/scripts.ts';
import type { MoonConfiguration } from './types.ts';

// https://moonrepo.dev/docs

const title = 'moonrepo';

const enablers = ['@moonrepo/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const isRootOnly = true;

const config = ['moon.yml', '.moon/tasks.yml', '.moon/tasks/*.yml'];

const resolveConfig: ResolveConfig<MoonConfiguration> = async (config, options) => {
  const tasks = config.tasks ? Object.values(config.tasks) : [];
  // Scripts resolve from options.cwd, and relative roots keep a cwd with spaces or parentheses out of the command
  const expand = (value: string) =>
    value.replace('$workspaceRoot', relative(options.cwd, options.rootCwd)).replace('$projectRoot', '.');
  const toCommand = (value: string | string[]) =>
    Array.isArray(value) ? toShellCommand(value.map(expand)) : expand(value);
  const scripts: string[] = [];
  for (const task of tasks) {
    if (task.script) scripts.push(expand(task.script));
    else if (task.command)
      scripts.push(task.args ? `${toCommand(task.command)} ${toCommand(task.args)}` : toCommand(task.command));
  }
  return options.getInputsFromScripts(scripts);
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

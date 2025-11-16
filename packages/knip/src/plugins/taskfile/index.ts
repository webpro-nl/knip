import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { _firstGlob } from '../../util/glob.js';
import type { Input } from '../../util/input.js';
import { toConfig } from '../../util/input.js';
import { join, relative } from '../../util/path.js';
import type { TaskfileCommand, TaskfileConfig, TaskfileTask } from './types.js';

// https://taskfile.dev/

const title = 'Taskfile';

const enablers =
  'This plugin is enabled when a Taskfile is found (Taskfile.yml, taskfile.yml, Taskfile.yaml, taskfile.yaml, etc.).';

const isRootOnly = true;

const defaultConfigPatterns = ['{T,t}askfile.{yml,yaml}', '{T,t}askfile.dist.{yml,yaml}'];

const isEnabled: IsPluginEnabled = async ({ cwd, config }) => {
  if (config.taskfile) return true;
  return Boolean(await _firstGlob({ cwd, patterns: defaultConfigPatterns }));
};

const extractScriptsFromCommand = (command: TaskfileCommand): string[] => {
  const scripts: string[] = [];
  if (typeof command === 'string') {
    scripts.push(command);
  } else if (command && typeof command === 'object') {
    if (command.cmd && typeof command.cmd === 'string') {
      scripts.push(command.cmd);
    }
    if (command.defer) {
      if (typeof command.defer === 'string') {
        scripts.push(command.defer);
      } else if (command.defer && typeof command.defer === 'object' && 'cmd' in command.defer) {
        if (typeof command.defer.cmd === 'string') {
          scripts.push(command.defer.cmd);
        }
      }
    }
    if (command.for && 'cmd' in command && typeof command.cmd === 'string') {
      scripts.push(command.cmd);
    }
  }
  return scripts;
};

const extractScriptsFromTask = (task: TaskfileTask): string[] => {
  const scripts: string[] = [];
  if (typeof task === 'string') {
    scripts.push(task);
    return scripts;
  }
  if (Array.isArray(task)) {
    for (const cmd of task) {
      if (typeof cmd === 'string') {
        scripts.push(cmd);
      }
    }
    return scripts;
  }
  if (task && typeof task === 'object') {
    if (task.cmd && typeof task.cmd === 'string') {
      scripts.push(task.cmd);
    }
    if (task.cmds) {
      if (typeof task.cmds === 'string') {
        scripts.push(task.cmds);
      } else if (Array.isArray(task.cmds)) {
        for (const cmd of task.cmds) {
          scripts.push(...extractScriptsFromCommand(cmd));
        }
      }
    }
  }
  return scripts;
};

const resolveConfig: ResolveConfig<TaskfileConfig> = async (localConfig, options) => {
  if (!localConfig || !options.configFilePath) return [];

  const { configFilePath, getInputsFromScripts, isProduction, configFileDir } = options;
  const inputs: Input[] = [];

  if (localConfig.includes && typeof localConfig.includes === 'object') {
    for (const includeValue of Object.values(localConfig.includes)) {
      const includePath =
        typeof includeValue === 'string'
          ? includeValue
          : includeValue && typeof includeValue === 'object' && 'taskfile' in includeValue
            ? includeValue.taskfile
            : undefined;
      if (includePath) {
        const resolvedPath = join(configFileDir, includePath);
        inputs.push(toConfig('taskfile', relative(configFileDir, resolvedPath), { containingFilePath: configFileDir }));
      }
    }
  }

  if (localConfig.tasks && typeof localConfig.tasks === 'object') {
    for (const task of Object.values(localConfig.tasks)) {
      for (const script of extractScriptsFromTask(task)) {
        for (const input of getInputsFromScripts([script], {
          knownBinsOnly: true,
          containingFilePath: configFilePath,
        })) {
          if (isProduction) Object.assign(input, { optional: true });
          inputs.push({ ...input, dir: configFileDir });
        }
      }
    }
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config: defaultConfigPatterns,
  resolveConfig,
  isRootOnly,
};

export default plugin;

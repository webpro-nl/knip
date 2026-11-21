import type { IsPluginEnabled, Plugin, PluginOptions } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { VitePlusConfig } from './types.ts';

// https://github.com/voidzero-dev/vite-plus

const title = 'vite-plus';

const enablers = ['vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

export const getTaskInputs = (configs: VitePlusConfig[], options: PluginOptions): Input[] => {
  const commands = new Set<string>();
  const addCommands = (value: unknown) => {
    for (const command of [value].flat()) if (typeof command === 'string') commands.add(command);
  };

  for (const { run, staged } of configs) {
    for (const task of Object.values(run?.tasks ?? {})) {
      addCommands(typeof task === 'string' || Array.isArray(task) ? task : task.command);
    }
    if (typeof staged === 'object') for (const command of Object.values(staged)) addCommands(command);
  }

  return options.getInputsFromScripts(commands, { optionalBinaries: true });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;

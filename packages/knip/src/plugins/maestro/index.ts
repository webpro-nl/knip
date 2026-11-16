import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { hasFileWithExtension } from '../../util/fs.ts';
import { type Input, toEntryPath } from '../../util/input.ts';
import type { Command, MaestroConfig } from './types.ts';

// https://docs.maestro.dev
// https://github.com/mobile-dev-inc/maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/yaml/YamlFluentCommand.kt
// https://github.com/mobile-dev-inc/maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/workspace/DependencyResolver.kt

const title = 'Maestro';

const enablers = 'This plugin is enabled when a `.yaml` or `.yml` file is found in the `.maestro` folder.';

const isEnabled: IsPluginEnabled = ({ cwd }) => hasFileWithExtension(cwd, '.maestro', ['.yaml', '.yml']);

const config = ['.maestro/**/*.{yaml,yml}'];

const addScripts = (commands: Command[] | undefined, inputs: Input[]) => {
  if (!Array.isArray(commands)) return;
  for (const command of commands) {
    if (!command || typeof command !== 'object') continue;
    const { runScript } = command;
    if (typeof runScript === 'string') inputs.push(toEntryPath(runScript));
    else if (typeof runScript?.file === 'string') inputs.push(toEntryPath(runScript.file));
    for (const nested of [command.runFlow, command.repeat, command.retry]) {
      if (nested && typeof nested === 'object') addScripts(nested.commands, inputs);
    }
  }
};

const resolveConfig: ResolveConfig<MaestroConfig> = config => {
  const inputs: Input[] = [];
  if (Array.isArray(config)) {
    const [header, commands] = config;
    addScripts(header?.onFlowStart, inputs);
    addScripts(header?.onFlowComplete, inputs);
    addScripts(commands, inputs);
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

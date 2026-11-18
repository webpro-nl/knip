import type { IsPluginEnabled, ParseConfig, Plugin, ResolveConfig } from '../../types/config.ts';
import { isDirectory } from '../../util/fs.ts';
import { type Input, toConfig, toEntryPath } from '../../util/input.ts';
import type { Command, File, MaestroConfig } from './types.ts';

// https://docs.maestro.dev
// https://github.com/mobile-dev-inc/maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/yaml/YamlFluentCommand.kt
// https://github.com/mobile-dev-inc/maestro/blob/cli-2.12.1/maestro-orchestra/src/main/java/maestro/orchestra/workspace/DependencyResolver.kt

const title = 'Maestro';

const enablers = 'This plugin is enabled when a `.maestro` folder is found.';

const isEnabled: IsPluginEnabled = ({ cwd }) => isDirectory(cwd, '.maestro');

const config = ['.maestro/**/*.{yaml,yml}'];

const parseConfig: ParseConfig = async source => {
  const { parseAllDocuments } = await import('yaml');
  return parseAllDocuments(source, { logLevel: 'error' }).map(document => {
    if (document.errors.length > 0) throw document.errors[0];
    return document.toJS();
  });
};

const getFile = (value: File | undefined) => (typeof value === 'string' ? value : value?.file);

const addInputs = (commands: Command[] | undefined, inputs: Input[]) => {
  if (!Array.isArray(commands)) return;
  for (const command of commands) {
    if (!command || typeof command !== 'object') continue;
    const script = getFile(command.runScript);
    if (typeof script === 'string') inputs.push(toEntryPath(script));
    for (const nested of [command.runFlow, command.retry]) {
      const flow = getFile(nested);
      if (typeof flow === 'string') inputs.push(toConfig('maestro', flow));
    }
    for (const nested of [command.runFlow, command.repeat, command.retry]) {
      if (nested && typeof nested === 'object') addInputs(nested.commands, inputs);
    }
  }
};

const resolveConfig: ResolveConfig<MaestroConfig> = config => {
  const inputs: Input[] = [];
  if (config.length === 2) {
    const [header, commands] = config;
    addInputs(header?.onFlowStart, inputs);
    addInputs(header?.onFlowComplete, inputs);
    addInputs(commands, inputs);
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  parseConfig,
  resolveConfig,
};

export default plugin;

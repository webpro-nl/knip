import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { Input } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { NanoStagedConfig } from './types.js';

// https://github.com/usmanyunusov/nano-staged

const title = 'Nano Staged';

const enablers = ['nano-staged'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = [
  'package.json',
  '.nano-staged.{js,cjs,mjs,json}',
  'nano-staged.{js,cjs,mjs,json}',
  '.nanostagedrc',
];

const resolveConfig: ResolveConfig<NanoStagedConfig> = async (config, options) => {
  if (options.isProduction) return [];

  if (typeof config === 'function') config = config();

  if (!config) return [];

  const inputs = new Set<Input>();

  for (const entry of Object.values(config).flat()) {
    const api = { filenames: ['./example.js'] };
    const scripts = [typeof entry === 'function' ? await entry(api) : entry].flat();
    for (const id of options.getInputsFromScripts(scripts)) inputs.add(id);
  }

  return Array.from(inputs);
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

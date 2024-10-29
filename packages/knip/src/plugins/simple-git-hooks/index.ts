import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { Input } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://github.com/toplenboren/simple-git-hooks

const title = 'simple-git-hooks';

const enablers = ['simple-git-hooks'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'simple-git-hooks';

const config: string[] = [
  '.simple-git-hooks.{js,cjs}',
  'simple-git-hooks.{js,cjs}',
  '.simple-git-hooks.json',
  'simple-git-hooks.json',
  'package.json',
];

const resolveConfig: ResolveConfig<PluginConfig> = async (config, options) => {
  if (typeof config === 'function') config = config();

  if (!config) return [];

  const inputs = new Set<Input>();

  for (const hook of Object.values(config)) {
    for (const id of options.getInputsFromScripts(hook)) inputs.add(id);
  }

  return Array.from(inputs);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;

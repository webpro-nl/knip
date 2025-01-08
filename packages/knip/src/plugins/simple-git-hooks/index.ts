import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import type { Input } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { SimpleGitHooksConfig } from './types.js';

// https://github.com/toplenboren/simple-git-hooks

const title = 'simple-git-hooks';

const enablers = ['simple-git-hooks'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.simple-git-hooks.{js,cjs,json}', 'simple-git-hooks.{js,cjs,json}', 'package.json'];

const resolveConfig: ResolveConfig<SimpleGitHooksConfig> = async (config, options) => {
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
  config,
  resolveConfig,
} satisfies Plugin;

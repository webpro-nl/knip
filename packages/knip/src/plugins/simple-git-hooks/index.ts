import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { SimpleGitHooksConfig } from './types.ts';

// https://github.com/toplenboren/simple-git-hooks

const title = 'simple-git-hooks';

const enablers = ['simple-git-hooks'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.simple-git-hooks.{js,cjs,json}', 'simple-git-hooks.{js,cjs,json}', 'package.json'];

const resolveConfig: ResolveConfig<SimpleGitHooksConfig> = async (config, options) => {
  if (options.isProduction) return [];

  if (typeof config === 'function') config = config();

  if (!config) return [];

  const inputs = new Set<Input>();

  for (const hook of Object.values(config)) {
    for (const id of options.getInputsFromScripts(hook)) inputs.add(id);
  }

  return [toDependency('simple-git-hooks'), ...Array.from(inputs)];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import type { PluginConfig } from './types.js';

// https://github.com/toplenboren/simple-git-hooks

const title = 'simple-git-hooks';

const enablers: EnablerPatterns = ['simple-git-hooks'];

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

  const dependencies = new Set<string>();

  for (const hook of Object.values(config)) {
    for (const id of getDependenciesFromScripts(hook, options)) dependencies.add(id);
  }

  return Array.from(dependencies);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;

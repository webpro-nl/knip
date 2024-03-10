import { getDependenciesFromScripts, hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { LintStagedConfig } from './types.js';

// https://github.com/okonet/lint-staged

const title = 'lint-staged';

const enablers = ['lint-staged'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'lint-staged';

const config = [
  '.lintstagedrc',
  '.lintstagedrc.json',
  '.lintstagedrc.{yml,yaml}',
  '.lintstagedrc.{js,mjs,cjs}',
  'lint-staged.config.{js,mjs,cjs}',
  'package.json',
];

const resolveConfig: ResolveConfig<LintStagedConfig> = async (config, options) => {
  if (typeof config === 'function') config = config();

  if (!config) return [];

  const dependencies = new Set<string>();

  for (const entry of Object.values(config).flat()) {
    const scripts = [typeof entry === 'function' ? await entry([]) : entry].flat();
    getDependenciesFromScripts(scripts, options).forEach(identifier => dependencies.add(identifier));
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
} as const;

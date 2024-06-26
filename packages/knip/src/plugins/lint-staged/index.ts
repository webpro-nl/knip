import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { getDependenciesFromScripts, hasDependency, toLilconfig } from '#p/util/plugin.js';
import type { LintStagedConfig } from './types.js';

// https://github.com/okonet/lint-staged

const title = 'lint-staged';

const enablers = ['lint-staged'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'lint-staged';

const config = [
  'package.json',
  'package.yaml',
  'package.yml',
  ...toLilconfig('lint-staged'),
  ...toLilconfig('lintstaged'),
];

const resolveConfig: ResolveConfig<LintStagedConfig> = async (config, options) => {
  if (typeof config === 'function') config = config();

  if (!config) return [];

  const dependencies = new Set<string>();

  for (const entry of Object.values(config).flat()) {
    const scripts = [typeof entry === 'function' ? await entry([]) : entry].flat();
    for (const id of getDependenciesFromScripts(scripts, options)) dependencies.add(id);
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

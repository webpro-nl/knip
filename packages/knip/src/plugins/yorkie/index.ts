import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Dependency, toDependency } from '../../util/dependencies.js';
import { hasDependency } from '../../util/plugin.js';
import type { LintStagedConfig } from '../lint-staged/types.js';

// https://github.com/yyx990803/yorkie

const title = 'yorkie';

const enablers = ['yorkie'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'gitHooks';

const config = ['package.json'];

const resolveConfig: ResolveConfig<LintStagedConfig> = (config, options) => {
  const dependencies = new Set<Dependency>();

  for (const script of Object.values(config).flat()) {
    const scripts = [script].flat();
    for (const identifier of options.getDependenciesFromScripts(scripts)) dependencies.add(identifier);
  }

  // Looks like the idea is to have lint-staged installed too, so there are no refs to yorkie
  return [toDependency('yorkie'), ...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
} satisfies Plugin;

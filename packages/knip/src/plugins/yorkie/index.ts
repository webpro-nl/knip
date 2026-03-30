import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { LintStagedConfig } from '../lint-staged/types.ts';

// https://github.com/yyx990803/yorkie

const title = 'yorkie';

const enablers = ['yorkie'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const packageJsonPath = 'gitHooks';

const config = ['package.json'];

const resolveConfig: ResolveConfig<LintStagedConfig> = (config, options) => {
  const inputs = new Set<Input>();

  for (const script of Object.values(config).flat()) {
    const scripts = [script].flat();
    for (const identifier of options.getInputsFromScripts(scripts)) inputs.add(identifier);
  }

  // Looks like the idea is to have lint-staged installed too, so there are no refs to yorkie
  return [toDependency('yorkie'), ...inputs];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;

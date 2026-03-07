import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { isInternal } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { OxlintConfig } from './types.ts';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.json'];

const args = {
  config: true,
};

const resolveJsPlugins = (jsPlugins: OxlintConfig['jsPlugins']): Input[] => {
  const inputs: Input[] = [];
  for (const plugin of jsPlugins ?? []) {
    const specifier = typeof plugin === 'string' ? plugin : plugin.specifier;
    if (!isInternal(specifier)) inputs.push(toDependency(specifier));
  }
  return inputs;
};

const resolveConfig: ResolveConfig<OxlintConfig> = config => {
  const inputs = resolveJsPlugins(config.jsPlugins);
  for (const override of config.overrides ?? []) {
    for (const input of resolveJsPlugins(override.jsPlugins)) inputs.push(input);
  }
  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;

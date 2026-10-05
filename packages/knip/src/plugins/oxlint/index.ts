import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toConfig, toDependency, toEntry } from '../../util/input.ts';
import { dirname, isInternal, toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getInputsFromSettings } from '../eslint/helpers.ts';
import type { OxlintConfig } from './types.ts';

// https://oxc.rs/docs/guide/usage/linter/config.html

const title = 'Oxlint';

const enablers = ['oxlint', 'vite-plus'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.oxlintrc.{json,jsonc}', 'oxlint.config.{ts,mts}'];

const args = {
  config: true,
};

const resolveJsPlugins = (jsPlugins: OxlintConfig['jsPlugins'], configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  const dir = dirname(configFilePath);
  for (const plugin of jsPlugins ?? []) {
    const specifier = typeof plugin === 'string' ? plugin : plugin.specifier;
    if (!isInternal(specifier)) inputs.push(toDependency(specifier));
    else inputs.push(toEntry(toAbsolute(specifier, dir)));
  }
  return inputs;
};

export const resolveExtendedConfig = (config: OxlintConfig, configFilePath: string): Input[] => {
  const inputs: Input[] = [];
  for (const entry of config.extends ?? []) {
    if (typeof entry === 'string') {
      const filePath = toAbsolute(entry, dirname(configFilePath));
      inputs.push(toConfig('oxlint', filePath, { containingFilePath: configFilePath }));
    } else {
      for (const input of resolveExtendedConfig(entry, configFilePath)) inputs.push(input);
    }
  }
  for (const input of resolveJsPlugins(config.jsPlugins, configFilePath)) inputs.push(input);
  for (const override of config.overrides ?? []) {
    for (const input of resolveJsPlugins(override.jsPlugins, configFilePath)) inputs.push(input);
    for (const input of getInputsFromSettings(override.settings)) inputs.push(input);
  }
  for (const input of getInputsFromSettings(config.settings)) inputs.push(input);
  return inputs;
};

const resolveConfig: ResolveConfig<OxlintConfig> = (config, options) =>
  resolveExtendedConfig(config, options.configFilePath);

const isFilterTransitiveDependencies = true;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  isFilterTransitiveDependencies,
  args,
};

export default plugin;

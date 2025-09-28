import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import type { StyleLintConfig } from './types.js';

// https://stylelint.io/user-guide/configure/

const title = 'Stylelint';

const enablers = ['stylelint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('stylelint')];

const resolveConfig: ResolveConfig<StyleLintConfig> = async (config, options) => {
  const inputs: Input[] = [];
  const extend = Array.isArray(config.extends) ? config.extends : config.extends ? [config.extends] : [];
  for (const id of extend) {
    if (typeof id === 'string') inputs.push(toDeferResolve(id));
    else for (const x of await resolveConfig(id, options)) inputs.push(x);
  }
  for (const plugin of config.plugins ?? []) if (typeof plugin === 'string') inputs.push(toDeferResolve(plugin));
  if (typeof config.customSyntax === 'string') inputs.push(toDeferResolve(config.customSyntax));
  for (const override of config.overrides ?? []) {
    for (const input of await resolveConfig(override, options)) inputs.push(input);
  }
  return inputs;
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

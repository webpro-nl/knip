import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDeferResolve } from '../../util/input.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
import type { BaseStyleLintConfig, StyleLintConfig } from './types.js';

// https://stylelint.io/user-guide/configure/

const title = 'Stylelint';

const enablers = ['stylelint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('stylelint')];

const resolve = (config: StyleLintConfig | BaseStyleLintConfig): Input[] => {
  const extend = config.extends ?? [];
  const plugins = config.plugins ?? [];
  const customSyntax: string[] = typeof config.customSyntax === 'string' ? [config.customSyntax] : [];

  const overrideConfigs = 'overrides' in config ? config.overrides.flatMap(resolve) : [];
  return [...[extend, plugins, customSyntax].flat().map(toDeferResolve), ...overrideConfigs];
};

const resolveConfig: ResolveConfig<StyleLintConfig> = config => resolve(config);

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Dependency, toDeferResolve } from '../../util/dependencies.js';
import { toCosmiconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';
import type { BaseStyleLintConfig, StyleLintConfig } from './types.js';

// https://stylelint.io/user-guide/configure/

const title = 'Stylelint';

const enablers = ['stylelint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json', ...toCosmiconfig('stylelint')];

const resolve = (config: StyleLintConfig | BaseStyleLintConfig): Dependency[] => {
  const extend = config.extends ? [config.extends].flat() : [];
  const plugins = config.plugins ? [config.plugins].flat() : [];
  const customSyntax = config.customSyntax ? [config.customSyntax] : [];
  const overrideConfigs = 'overrides' in config ? config.overrides.flatMap(resolve) : [];
  return [...[...extend, ...plugins, ...customSyntax].map(toDeferResolve), ...overrideConfigs];
};

const resolveConfig: ResolveConfig<StyleLintConfig> = config => resolve(config);

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

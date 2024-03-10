import { isInternal } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import type { ResolveConfig, IsPluginEnabled } from '#p/types/plugins.js';
import type { BaseStyleLintConfig, StyleLintConfig } from './types.js';

// https://stylelint.io/user-guide/configure/

const title = 'Stylelint';

const enablers = ['stylelint'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.stylelintrc', '.stylelintrc.{cjs,js,json,yaml,yml}', 'stylelint.config.{cjs,mjs,js}'];

const resolve = (config: StyleLintConfig | BaseStyleLintConfig): string[] => {
  const extend = config.extends ? [config.extends].flat().filter(id => !isInternal(id)) : [];
  const plugins = config.plugins ? [config.plugins].flat().filter(id => !isInternal(id)) : [];
  const overrideConfigs = 'overrides' in config ? config.overrides.flatMap(resolve) : [];
  return [...extend, ...plugins, ...overrideConfigs];
};

const resolveConfig: ResolveConfig<StyleLintConfig> = config => resolve(config);

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} as const;

import { basename, isInternal } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { BaseStyleLintConfig, StyleLintConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://stylelint.io/user-guide/configure/

const NAME = 'Stylelint';

const ENABLERS = ['stylelint'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['.stylelintrc', '.stylelintrc.{cjs,js,json,yaml,yml}', 'stylelint.config.{cjs,mjs,js}'];

const findDependenciesInConfig = (config: StyleLintConfig | BaseStyleLintConfig): string[] => {
  const extend = config.extends ? [config.extends].flat().filter(id => !isInternal(id)) : [];
  const plugins = config.plugins ? [config.plugins].flat().filter(id => !isInternal(id)) : [];
  const overrideConfigs = 'overrides' in config ? config.overrides.flatMap(findDependenciesInConfig) : [];
  return [...extend, ...plugins, ...overrideConfigs];
};

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  if (isProduction) return [];

  const localConfig: StyleLintConfig | undefined =
    basename(configFilePath) === 'package.json' ? manifest.stylelint : await load(configFilePath);

  if (!localConfig) return [];

  return findDependenciesInConfig(localConfig);
};

const findDependencies = timerify(findPluginDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};

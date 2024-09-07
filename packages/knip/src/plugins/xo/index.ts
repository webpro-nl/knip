import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { getDependenciesDeep } from '../eslint/helpers.js';
import type { XOConfig } from './types.js';

// link to xo docs: https://github.com/xojs/xo#config
// Uses custom cosmiconfig search paths
// https://github.com/xojs/xo/blob/ee9f0a3d72d55df098fc321c4d54a1ea3804e226/lib/constants.js

const title = 'xo';

const enablers: EnablerPatterns = ['xo'];

const isEnabled: IsPluginEnabled = ({ dependencies, config }) =>
  hasDependency(dependencies, enablers) || 'xo' in config;

const packageJsonPath = 'xo';
const config = ['package.json', '.xo-config', '.xo-config.{js,cjs,json}', 'xo.config.{js,cjs}'];

const entry: string[] = ['.xo-config.{js,cjs}', 'xo.config.{js,cjs}'];

const resolveConfig: ResolveConfig<XOConfig> = async (config, options) => {
  const dependencies = await getDependenciesDeep(config, options);
  return [...dependencies];
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  entry,
  config,
  resolveConfig,
} satisfies Plugin;

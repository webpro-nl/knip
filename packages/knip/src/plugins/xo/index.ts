import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { getInputs } from '../eslint/helpers.js';
import type { XOConfig } from './types.js';

// https://github.com/xojs/xo#config
// https://github.com/xojs/xo/blob/ee9f0a3d72d55df098fc321c4d54a1ea3804e226/lib/constants.js

const title = 'xo';

const enablers = ['xo'];

const isEnabled: IsPluginEnabled = ({ dependencies, config }) =>
  hasDependency(dependencies, enablers) || 'xo' in config;

const config = ['package.json', '.xo-config', '.xo-config.{js,cjs,json}', 'xo.config.{js,cjs}'];

const entry = ['.xo-config.{js,cjs}', 'xo.config.{js,cjs}'];

const resolveConfig: ResolveConfig<XOConfig> = async (config, options) => {
  const inputs = getInputs(config, options);
  return [...inputs];
};

export default {
  title,
  enablers,
  isEnabled,
  entry,
  config,
  resolveConfig,
} satisfies Plugin;

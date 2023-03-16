import { timerify } from '../../util/performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://typedoc.org/guides/overview/

export const NAME = 'TypeDoc';

/** @public */
export const ENABLERS = ['typedoc'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = [
  'typedoc.{js,cjs,json,jsonc}',
  'typedoc.config.{js,cjs}',
  '.config/typedoc.{js,cjs,json,jsonc}',
  '.config/typedoc.config.{js,cjs}',
];

const findTypeDocDependencies: GenericPluginCallback = async configFilePath => {
  const config: PluginConfig = await load(configFilePath);
  return config?.plugin ?? [];
};

export const findDependencies = timerify(findTypeDocDependencies);

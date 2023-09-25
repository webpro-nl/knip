import { timerify } from '../../util/Performance.js';
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
  'package.json',
  'tsconfig.json',
];

const findTypeDocDependencies: GenericPluginCallback = async (configFilePath, { manifest, isProduction }) => {
  if (isProduction) return [];

  const config: PluginConfig = configFilePath.endsWith('package.json')
    ? manifest.typedocOptions
    : configFilePath.endsWith('tsconfig.json')
    ? (await load(configFilePath)).typedocOptions
    : await load(configFilePath);
  return config?.plugin ?? [];
};

export const findDependencies = timerify(findTypeDocDependencies);

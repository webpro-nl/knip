import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';

export const NAME = 'TypeScript';

/** @public */
export const ENABLERS = ['typescript'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) =>
  ENABLERS.some(enabler => dependencies.has(enabler));

export const CONFIG_FILE_PATTERNS = ['tsconfig.json'];

const findTypeScriptDependencies: GenericPluginCallback = async configFilePath => {
  const config: TsConfigJson = await _load(configFilePath);
  const extend = config?.extends && !config.extends.startsWith('.') ? [getPackageName(config.extends)] : [];
  const plugins = compact(config?.compilerOptions?.plugins?.map(plugin => plugin.name) ?? []);
  return [...extend, ...plugins];
};

export const findDependencies = timerify(findTypeScriptDependencies);

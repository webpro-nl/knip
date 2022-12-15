import { compact } from '../../util/array.js';
import { _load } from '../../util/loader.js';
import { getPackageName } from '../../util/modules.js';
import { timerify } from '../../util/performance.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';

export const CONFIG_FILE_PATTERNS = ['tsconfig.json'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => dependencies.has('typescript');

const findTypeScriptDependencies: GenericPluginCallback = async configFilePath => {
  const config: TsConfigJson = await _load(configFilePath);
  const extend = config?.extends ? [getPackageName(config.extends)] : [];
  const plugins = compact(config?.compilerOptions?.plugins?.map(plugin => plugin.name) ?? []);
  return [...extend, ...plugins];
};

export const findDependencies = timerify(findTypeScriptDependencies);

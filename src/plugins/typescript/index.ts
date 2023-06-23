import { compact } from '../../util/array.js';
import { isInternal } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';

export const NAME = 'TypeScript';

/** @public */
export const ENABLERS = ['typescript'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tsconfig.json'];

const findTypeScriptDependencies: GenericPluginCallback = async configFilePath => {
  const config: TsConfigJson = await load(configFilePath);

  if (!config) return [];

  const extend = config.extends ? [config.extends].flat().filter(extend => !isInternal(extend)) : [];
  const plugins = compact(config.compilerOptions?.plugins?.map(plugin => plugin.name) ?? []);
  const importHelpers = config.compilerOptions?.importHelpers ? ['tslib'] : [];
  return [...extend, ...plugins, ...importHelpers];
};

export const findDependencies = timerify(findTypeScriptDependencies);

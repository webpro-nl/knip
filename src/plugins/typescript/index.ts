import { compact } from '../../util/array.js';
import { dirname, isInternal, toAbsolute } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';

// https://www.typescriptlang.org/tsconfig

export const NAME = 'TypeScript';

/** @public */
export const ENABLERS = ['typescript'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tsconfig.json'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config = await load(configFilePath);
  if (config?.extends) {
    if (isInternal(config.extends)) {
      const presetConfigPath = toAbsolute(config.extends, dirname(configFilePath));
      const presetConfig = await resolveExtensibleConfig(presetConfigPath);
      Object.assign(config, presetConfig);
    }
  }
  return config;
};

const findTypeScriptDependencies: GenericPluginCallback = async configFilePath => {
  const config: TsConfigJson = await resolveExtensibleConfig(configFilePath);

  if (!config) return [];

  const extend = config.extends ? [config.extends].flat().filter(extend => !isInternal(extend)) : [];
  const plugins = compact(config.compilerOptions?.plugins?.map(plugin => plugin.name) ?? []);
  const importHelpers = config.compilerOptions?.importHelpers ? ['tslib'] : [];
  const jsx = config.compilerOptions?.jsxImportSource
    ? [config.compilerOptions.jsxImportSource]
    : config.compilerOptions?.jsx
    ? ['react']
    : [];
  return [...extend, ...plugins, ...importHelpers, ...jsx];
};

export const findDependencies = timerify(findTypeScriptDependencies);

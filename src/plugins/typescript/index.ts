import { compact } from '../../util/array.js';
import { dirname, isInternal, toAbsolute } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { loadTSConfig } from '../../util/tsconfig-loader.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import type { TsConfigJson } from 'type-fest';
import type { CompilerOptions } from 'typescript';

// https://www.typescriptlang.org/tsconfig

export const NAME = 'TypeScript';

/** @public */
export const ENABLERS = ['typescript'];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const CONFIG_FILE_PATTERNS = ['tsconfig.json', 'tsconfig.*.json'];

const resolveExtensibleConfig = async (configFilePath: string) => {
  const config: TsConfigJson = await load(configFilePath);
  config.extends = config.extends ? [config.extends].flat() : [];
  if (config?.extends) {
    for (const extend of [config.extends].flat()) {
      if (isInternal(extend)) {
        const presetConfigPath = toAbsolute(extend, dirname(configFilePath));
        const presetConfig = await resolveExtensibleConfig(presetConfigPath);
        config.extends.push(...(presetConfig.extends ? [presetConfig.extends].flat() : []));
      }
    }
  }
  return config;
};

export const findTypeScriptDependencies: GenericPluginCallback = async configFilePath => {
  const compilerOptions: CompilerOptions = await loadTSConfig(configFilePath);
  const config: TsConfigJson = await resolveExtensibleConfig(configFilePath); // Dual loader to get external `extends` dependencies

  if (!compilerOptions || !config) return [];

  const extend = config.extends ? [config.extends].flat().filter(extend => !isInternal(extend)) : [];
  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];
  const jsx = compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : [];
  return compact([...extend, ...types, ...plugins, ...importHelpers, ...jsx]);
};

export const findDependencies = timerify(findTypeScriptDependencies);

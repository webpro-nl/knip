import { compact } from '#p/util/array.js';
import { dirname, isInternal, join, toAbsolute } from '#p/util/path.js';
import { hasDependency, loadJSON } from '#p/util/plugin.js';
import { loadTSConfig } from '#p/util/tsconfig-loader.js';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '#p/types/plugins.js';
import type { TsConfigJson } from 'type-fest';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json', 'tsconfig.*.json'];

const production: string[] = [];

const getExtends = async (configFilePath: string, internalExtends = new Set<string>()) => {
  const filePath = configFilePath.replace(/(\.json)?$/, '.json');
  const localConfig: TsConfigJson | undefined = await loadJSON(filePath);

  if (!localConfig) return internalExtends;

  const extends_ = localConfig.extends ? [localConfig.extends].flat() : [];
  for (const extend of extends_) {
    if (isInternal(extend)) {
      const presetConfigPath = toAbsolute(extend, dirname(configFilePath));
      await getExtends(presetConfigPath, internalExtends);
    }
  }

  extends_.forEach(extend => internalExtends.add(extend));
  return internalExtends;
};

export const resolveConfig: ResolveConfig = async (localConfig, options) => {
  const { isProduction, configFileDir, configFileName } = options;

  const configFilePath = join(configFileDir, configFileName);
  const { compilerOptions } = await loadTSConfig(configFilePath);

  const extend = await getExtends(configFilePath);

  if (!compilerOptions || !localConfig) return [];

  const jsx = compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : [];

  if (isProduction) return [...jsx];

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([...extend, ...types, ...plugins, ...importHelpers, ...jsx]);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
} satisfies Plugin;

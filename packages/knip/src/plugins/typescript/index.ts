import type { TsConfigJson } from 'type-fest';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { dirname, isInternal, join, toAbsolute } from '../../util/path.js';
import { hasDependency, loadJSON } from '../../util/plugin.js';
import { type Dependency, toConfig, toDependency, toProductionDependency } from '../../util/protocols.js';
import { loadTSConfig } from '../../util/tsconfig-loader.js';

// https://www.typescriptlang.org/tsconfig

const title = 'TypeScript';

const enablers = ['typescript'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsconfig.json'];

const production: string[] = [];

const getExtends = async (configFilePath: string, extendSet = new Set<Dependency>()) => {
  const filePath = configFilePath.replace(/(\.json)?$/, '.json');
  const localConfig: TsConfigJson | undefined = await loadJSON(filePath);

  if (!localConfig) return extendSet;

  const extends_ = localConfig.extends ? [localConfig.extends].flat() : [];
  for (const extend of extends_) {
    if (isInternal(extend)) {
      const presetConfigPath = toAbsolute(extend, dirname(configFilePath));
      await getExtends(presetConfigPath, extendSet);
    }
  }

  for (const extend of extends_) {
    if (isInternal(extend)) extendSet.add(toConfig('typescript', toAbsolute(extend, dirname(configFilePath))));
    else extendSet.add(toDependency(extend));
  }

  return extendSet;
};

const resolveConfig: ResolveConfig = async (localConfig, options) => {
  const { configFileDir, configFileName } = options;

  const configFilePath = join(configFileDir, configFileName);
  const { compilerOptions } = await loadTSConfig(configFilePath);

  const extend = await getExtends(configFilePath);

  if (!(compilerOptions && localConfig)) return [];

  const jsx = (compilerOptions?.jsxImportSource ? [compilerOptions.jsxImportSource] : []).map(toProductionDependency);

  const types = compilerOptions.types ?? [];
  const plugins = Array.isArray(compilerOptions?.plugins)
    ? compilerOptions.plugins.map(plugin => (typeof plugin === 'object' && 'name' in plugin ? plugin.name : ''))
    : [];
  const importHelpers = compilerOptions?.importHelpers ? ['tslib'] : [];

  return compact([...extend, ...[...types, ...plugins, ...importHelpers].map(toDependency), ...jsx]);
};

const args = {
  binaries: ['tsc'],
  string: ['project'],
  alias: { project: ['p'] },
  config: ['project'],
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
  args,
} satisfies Plugin;

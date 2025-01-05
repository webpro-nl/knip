import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toDeferResolve, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://metrobundler.dev/docs/configuration

const title = 'Metro';

const enablers = ['metro', 'react-native'];

const isEnabled: IsPluginEnabled = options => hasDependency(options.dependencies, enablers);

const packageJsonPath = 'metro';

const config: string[] = ['metro.config.{js,cjs,json}', 'package.json'];

const resolveEntryPaths: ResolveEntryPaths<PluginConfig> = async config => {
  if (!config.projectRoot) return [];

  const entryFilePattern = 'index.{js,jsx,ts,tsx}';
  const entryFilePath = join(config.projectRoot, entryFilePattern);
  return [toProductionEntry(entryFilePath)];
};

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const { transformerPath, transformer } = config;
  const inputs: string[] = [];

  if (transformerPath) inputs.push(transformerPath);
  if (transformer?.assetPlugins) inputs.push(...transformer.assetPlugins);
  if (transformer?.minifierPath) inputs.push(transformer.minifierPath);
  if (transformer?.babelTransformerPath) inputs.push(transformer.babelTransformerPath);

  return [...inputs].map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { compact } from '../../util/array.js';
import { type Input, toDeferResolve, toDependency, toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { MetroConfig } from './types.js';

// https://metrobundler.dev/docs/configuration

const title = 'Metro';

const enablers = ['metro', 'react-native'];

const isEnabled: IsPluginEnabled = options => hasDependency(options.dependencies, enablers);

const config = ['metro.config.{js,cjs,json}', 'package.json', 'react-native.config.js'];

const DEFAULT_PLATFORMS = ['ios', 'android', 'windows', 'web'];
const PLATFORMS = [...DEFAULT_PLATFORMS, 'native', 'default'];
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'json', 'ts', 'tsx'];
const DEFAULT_TRANSFORMER_PACKAGE = 'metro-transform-worker';
const DEFAULT_MINIFIER_PACKAGE = 'metro-minify-terser';
const RN_CLI_PACKAGES = [
  '@react-native-community/cli',
  '@react-native-community/cli-platform-android',
  '@react-native-community/cli-platform-ios',
];

const production = [`src/**/*.{${PLATFORMS.join(',')}}.{${DEFAULT_EXTENSIONS.join(',')}}`];

const resolveConfig: ResolveConfig<MetroConfig> = async (config, options) => {
  const manifestDependencies = new Set([
    ...Object.keys(options.manifest.dependencies ?? {}),
    ...Object.keys(options.manifest.devDependencies ?? {}),
  ]);
  const { transformerPath, transformer } = config;
  const i = new Set<Input>();
  const inputs: string[] = [];

  const platformEntryPatterns = compact(PLATFORMS.concat(config.resolver?.platforms ?? []));
  const sourceExts = config.resolver?.sourceExts ?? DEFAULT_EXTENSIONS;
  const pattern = `src/**/*.{${platformEntryPatterns.join(',')}}.{${sourceExts.join(',')}}`;

  if (!config.projectRoot) {
    i.add(toProductionEntry(pattern));
  } else {
    const entryFilePattern = 'index.{js,jsx,ts,tsx}';
    const entryFilePath = join(config.projectRoot, entryFilePattern);
    const entryFilePaths = join(config.projectRoot, pattern);
    i.add(toProductionEntry(entryFilePath));
    i.add(toProductionEntry(entryFilePaths));
  }

  if (transformerPath) inputs.push(transformerPath);
  if (transformer?.assetPlugins) inputs.push(...transformer.assetPlugins);
  if (transformer?.minifierPath) inputs.push(transformer.minifierPath);
  if (transformer?.babelTransformerPath) inputs.push(transformer.babelTransformerPath);

  for (const pkg of RN_CLI_PACKAGES) {
    if (manifestDependencies.has(pkg)) i.add(toDependency(pkg));
  }

  return Array.from(i).concat(
    [...inputs].map(id =>
      toDeferResolve(id, {
        optional: id === DEFAULT_TRANSFORMER_PACKAGE || id === DEFAULT_MINIFIER_PACKAGE,
      })
    )
  );
};

const isFilterTransitiveDependencies = true;

const note = `False positives for platform-specific unused files?
Override the default \`entry\` patterns to match platforms and extensions.`;

/** @public */
export const docs = { note };

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
  isFilterTransitiveDependencies,
};

export default plugin;

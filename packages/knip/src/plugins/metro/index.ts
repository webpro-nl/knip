import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { compact } from '../../util/array.ts';
import { type Input, toModule, toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MetroConfig } from './types.ts';

// https://metrobundler.dev/docs/configuration

const title = 'Metro';

const enablers = ['metro', '@react-native/metro-config', 'expo'];

const isEnabled: IsPluginEnabled = options => hasDependency(options.dependencies, enablers);

const config = [
  'metro.config.{js,cjs,mjs,ts,cts,mts,json}',
  '.config/metro.{js,cjs,mjs,ts,cts,mts,json}',
  'package.json',
];

const DEFAULT_PLATFORMS = ['ios', 'android', 'windows', 'web'];
const PLATFORMS = [...DEFAULT_PLATFORMS, 'native', 'default'];
const DEFAULT_EXTENSIONS = ['js', 'jsx', 'json', 'ts', 'tsx'];
const DEFAULT_TRANSFORMER_PACKAGE = 'metro-transform-worker';
const DEFAULT_MINIFIER_PACKAGE = 'metro-minify-terser';

const production = [`src/**/*.{${PLATFORMS.join(',')}}.{${DEFAULT_EXTENSIONS.join(',')}}`];

const resolveConfig: ResolveConfig<MetroConfig> = async config => {
  const { transformerPath, transformer } = config;
  const i = new Set<Input>();
  const inputs: string[] = [];

  const platformEntryPatterns = compact(PLATFORMS.concat(config.resolver?.platforms ?? []));
  const sourceExts = config.resolver?.sourceExts ?? DEFAULT_EXTENSIONS;
  const pattern = `src/**/*.{${platformEntryPatterns.join(',')}}.{${sourceExts.join(',')}}`;

  if (!config.projectRoot) {
    i.add(toEntry(pattern, { production: true }));
  } else {
    const entryFilePattern = 'index.{js,jsx,ts,tsx}';
    const entryFilePath = join(config.projectRoot, entryFilePattern);
    const entryFilePaths = join(config.projectRoot, pattern);
    i.add(toEntry(entryFilePath, { production: true }));
    i.add(toEntry(entryFilePaths, { production: true }));
  }

  if (transformerPath) inputs.push(transformerPath);
  if (transformer?.assetPlugins) inputs.push(...transformer.assetPlugins);
  if (transformer?.minifierPath) inputs.push(transformer.minifierPath);
  if (transformer?.babelTransformerPath) inputs.push(transformer.babelTransformerPath);

  return Array.from(i).concat(
    Array.from(inputs, id =>
      toModule(id, {
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

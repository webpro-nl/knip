import { isDirectory } from '#p/util/fs.js';
import { isInNodeModules, join } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toProductionEntryPattern } from '#p/util/protocols.js';
import { DEFAULT_EXTENSIONS } from '../../constants.js';
import { DummyEleventyConfig, defaultEleventyConfig } from './helpers.js';
import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '#p/types/plugins.js';
import type { EleventyConfig } from './types.js';

// https://www.11ty.dev/docs/

const title = 'Eleventy';

const enablers = ['@11ty/eleventy'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.eleventy.js', 'eleventy.config.{js,cjs,mjs}'];

const production = ['posts/**/*.11tydata.js', '_data/**/*.{js,cjs,mjs}'];

type T = Partial<EleventyConfig> | ((arg: DummyEleventyConfig) => Promise<Partial<EleventyConfig>>);

const resolveEntryPaths: ResolveEntryPaths<T> = async (localConfig, options) => {
  const { configFileDir } = options;

  const dummyUserConfig = new DummyEleventyConfig();
  if (typeof localConfig === 'function') localConfig = await localConfig(dummyUserConfig);

  const inputDir = localConfig?.dir?.input || defaultEleventyConfig.dir.input;
  const dataDir = localConfig?.dir?.data || defaultEleventyConfig.dir.data;
  const templateFormats = localConfig.templateFormats || defaultEleventyConfig.templateFormats;

  const exts = DEFAULT_EXTENSIONS.map(extname => extname.slice(1)).join(',');
  const copiedEntries = new Set<string>();

  for (const path of Object.keys(dummyUserConfig.passthroughCopies)) {
    const isDir = !path.includes('*') && isDirectory(join(configFileDir, path));
    if (isDir) {
      copiedEntries.add(join(path, `**/*.{${exts}}`));
    } else if (!isInNodeModules(path)) {
      copiedEntries.add(path);
    }
  }

  return [
    join(inputDir, dataDir, '**/*.{js,cjs,mjs}'),
    join(inputDir, `**/*.{${typeof templateFormats === 'string' ? templateFormats : templateFormats.join(',')}}`),
    join(inputDir, '**/*.11tydata.js'),
    ...copiedEntries,
  ].map(toProductionEntryPattern);
};

const resolveConfig: ResolveConfig<T> = async localConfig => {
  const dummyUserConfig = new DummyEleventyConfig();
  if (typeof localConfig === 'function') localConfig = await localConfig(dummyUserConfig);

  const copiedPackages = new Set<string>();

  for (const path of Object.keys(dummyUserConfig.passthroughCopies)) {
    if (isInNodeModules(path)) copiedPackages.add(path);
  }

  return [...copiedPackages];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

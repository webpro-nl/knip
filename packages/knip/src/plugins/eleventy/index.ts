import { DEFAULT_EXTENSIONS } from '../../constants.js';
import { isDirectory } from '../../util/fs.js';
import { dirname, isInternal, join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import { DummyEleventyConfig, defaultEleventyConfig } from './helpers.js';
import type { EleventyConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://www.11ty.dev/docs/

const NAME = 'Eleventy';

const ENABLERS = ['@11ty/eleventy'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS: string[] = ['.eleventy.js', 'eleventy.config.{js,cjs}'];

const ENTRY_FILE_PATTERNS: string[] = [];

const PRODUCTION_ENTRY_FILE_PATTERNS: string[] = ['posts/**/*.11tydata.js', '_data/**/*.{js,cjs,mjs}'];

const PROJECT_FILE_PATTERNS: string[] = [];

const findEleventyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  let localConfig = (await load(configFilePath)) as
    | Partial<EleventyConfig>
    | ((arg: DummyEleventyConfig) => Promise<Partial<EleventyConfig>>);
  if (!localConfig)
    return config.entry
      ? config.entry.map(toProductionEntryPattern)
      : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);

  const dummyUserConfig = new DummyEleventyConfig();
  if (typeof localConfig === 'function') localConfig = await localConfig(dummyUserConfig);

  const inputDir = localConfig?.dir?.input || defaultEleventyConfig.dir.input;
  const dataDir = localConfig?.dir?.data || defaultEleventyConfig.dir.data;
  const templateFormats = localConfig.templateFormats || defaultEleventyConfig.templateFormats;

  const exts = DEFAULT_EXTENSIONS.map(extname => extname.slice(1)).join(',');
  const copiedPackages = new Set<string>();
  const copiedEntries = new Set<string>();

  for (const path of Object.keys(dummyUserConfig.passthroughCopies)) {
    const isDir = !path.includes('*') && isDirectory(join(dirname(configFilePath), path));
    if (isDir) {
      copiedEntries.add(join(path, `**/*.{${exts}}`));
    } else if (isInternal(path)) {
      copiedEntries.add(path);
    } else {
      copiedPackages.add(path);
    }
  }

  return [
    ...(
      config?.entry ?? [
        join(inputDir, dataDir, '**/*.js'),
        join(inputDir, `**/*.{${typeof templateFormats === 'string' ? templateFormats : templateFormats.join(',')}}`),
        join(inputDir, '**/*.11tydata.js'),
        ...copiedEntries,
      ]
    ).map(toProductionEntryPattern),
    ...copiedPackages,
  ];
};

const findDependencies = timerify(findEleventyDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  PROJECT_FILE_PATTERNS,
  findDependencies,
};

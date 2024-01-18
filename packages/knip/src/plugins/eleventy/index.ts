import { DEFAULT_EXTENSIONS } from 'src/constants.js';
import { extname, join, normalize } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
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

  const copiedPackages = [];
  const copiedEntries = [];

  for (const path of Object.keys(dummyUserConfig.passthroughCopies).map(normalize)) {
    const parts = path.split('/');
    if (path.startsWith('node_modules/') && parts.length > 1) {
      copiedPackages.push(parts.at(1) as string);
    } else {
      if (path.endsWith('/')) {
        copiedEntries.push(`${path}*.{${DEFAULT_EXTENSIONS.join(',')}}`);
      } else copiedEntries.push(path);
    }
  }

  return [
    ...(
      config?.entry ?? [
        join(inputDir, dataDir, '**/*.js'),
        join(inputDir, `**/*.{${typeof templateFormats === 'string' ? templateFormats : templateFormats.join(',')}}`),
        join(inputDir, '**/*.11tydata.js'),
        ...copiedEntries.filter(path => DEFAULT_EXTENSIONS.includes(extname(path))),
      ]
    ).map(toEntryPattern),
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

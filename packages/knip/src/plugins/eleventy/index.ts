import { join } from '../../util/path.js';
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

const ENTRY_FILE_PATTERNS = ['.eleventy.js', 'eleventy.config.{js,cjs}'];

const PRODUCTION_ENTRY_FILE_PATTERNS = ['**/*.11tydata.js', '_data/**/*.{js,cjs,mjs}']
  .map(pattern => [`src/${pattern}`, `content/${pattern}`])
  .flat();

const findEleventyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  let localConfig = (await load(configFilePath)) as
    | Partial<EleventyConfig>
    | ((arg: DummyEleventyConfig) => Promise<Partial<EleventyConfig>>);
  if (!localConfig)
    return config.entry
      ? config.entry.map(toProductionEntryPattern)
      : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);
  if (typeof localConfig === 'function') localConfig = await localConfig(new DummyEleventyConfig());

  const inputDir = localConfig?.dir?.input || defaultEleventyConfig.dir.input;
  const dataDir = localConfig?.dir?.data || defaultEleventyConfig.dir.data;
  const templateFormats = localConfig.templateFormats || defaultEleventyConfig.templateFormats;

  return (
    config?.entry ?? [
      join(inputDir, dataDir, '**/*.js'),
      join(inputDir, `**/*.{${typeof templateFormats === 'string' ? templateFormats : templateFormats.join(',')}}`),
      join(inputDir, '**/*.11tydata.js'),
    ] ??
    ENTRY_FILE_PATTERNS
  ).map(toEntryPattern);
};

const findDependencies = timerify(findEleventyDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  findDependencies,
};

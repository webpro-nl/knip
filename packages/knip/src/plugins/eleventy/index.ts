import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';
import { DummyEleventyConfig, defaultEleventyConfig } from './helpers.js';
import type { EleventyConfig } from './types.js';
import { join } from '../../util/path.js';

// https://www.11ty.dev/docs/

const NAME = 'Eleventy';

const ENABLERS = ['@11ty/eleventy'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['.eleventy.js', 'eleventy.config.{js,cjs}'];

const PRODUCTION_ENTRY_FILE_PATTERNS = ['posts/**/*.11tydata.js', '_data/**/*.{js,cjs,mjs}'];

const findEleventyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  const localConfig: ((arg0: DummyEleventyConfig) => Promise<EleventyConfig>) = await load(configFilePath);

  const result = { ...(await localConfig(new DummyEleventyConfig())), ...defaultEleventyConfig }  

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];
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

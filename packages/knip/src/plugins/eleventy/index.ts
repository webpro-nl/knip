import { join } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import { DummyEleventyConfig, defaultEleventyConfig } from './helpers.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://www.11ty.dev/docs/

const NAME = 'Eleventy';

const ENABLERS = ['@11ty/eleventy'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['.eleventy.js', 'eleventy.config.{js,cjs}'];

const findEleventyDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  let localConfig = await load(configFilePath);
  if (typeof localConfig === 'function') localConfig = await localConfig(new DummyEleventyConfig());
  localConfig = { ...localConfig, ...defaultEleventyConfig };

  return (
    config?.entry ?? [
      join(localConfig.dir.input, localConfig.dir.data, '**/*.js'),
      join(localConfig.dir.input, '**/*.11tydata.js'),
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

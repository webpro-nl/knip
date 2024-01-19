import { DEFAULT_EXTENSIONS } from '../../constants.js';
import { basename } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { hasDependency, load } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { PluginConfig } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

// https://docs.netlify.com/ or https://docs.netlify.com/functions/get-started/?fn-language=ts

const NAME = 'Netlify';

const ENABLERS = ['@netlify/functions'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS: string[] = ['netlify.toml'];

const ENTRY_FILE_PATTERNS: string[] = [
  `netlify/functions/**/*.{${DEFAULT_EXTENSIONS.filter(ext => !ext.endsWith('x'))
    .map(ext => ext.slice(1))
    .join(',')}}`,
];

const PRODUCTION_ENTRY_FILE_PATTERNS: string[] = [];

const PROJECT_FILE_PATTERNS: string[] = [];

const findPluginDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  const localConfig: PluginConfig | undefined = await load(configFilePath);
  if (!localConfig) return [];

  /**
   * If the plugin allows to configure entry files, order of precedence (use only the first one that's set):
   *
   * 1. config.entry (user overrides in Knip config)
   * 2. entry patterns from `localConfig` (read from local tool config)
   * 3. ENTRY_FILE_PATTERNS (default/fallback as defined here in this plugin)
   */
  const entryPatterns = (config?.entry ?? localConfig.entryPathsOrPatterns ?? ENTRY_FILE_PATTERNS).map(toEntryPattern);

  /**
   * If the tool has the concept of entry files for production, we need `PRODUCTION_ENTRY_FILE_PATTERNS`. Return those
   * if `config.entry` is not set.
   */
  const productionPatterns = config.entry ? [] : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);

  /**
   * In production mode (isProduction=true) we have two common scenarios:
   *
   * - Plugins that don't deal with entry or production entry files at all can bail out at the start of this function.
   * - Plugins that only deal with `devDependencies` can bail out here and return all entry patterns.
   *
   * Both scenarios skip finding devDependencies in `localConfig`.
   */
  if (isProduction) return [...entryPatterns, ...productionPatterns];

  // resolve dependencies/binaries from local config file
  const dependencies = localConfig?.plugins ?? [];

  return [...dependencies, ...entryPatterns, ...productionPatterns];
};

const findDependencies = timerify(findPluginDependencies);

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

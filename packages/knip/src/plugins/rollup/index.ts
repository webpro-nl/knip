import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://rollupjs.org/guide/en/#configuration-files

const NAME = 'Rollup';

const ENABLERS = ['rollup'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['rollup.config.{js,cjs,mjs,ts}'];

const findRollupDependencies: GenericPluginCallback = async () => {
  const entryPatterns = ENTRY_FILE_PATTERNS.map(toEntryPattern);
  return entryPatterns;
};

const findDependencies = timerify(findRollupDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};

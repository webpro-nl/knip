import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://tailwindcss.com/docs/configuration

const NAME = 'Tailwind';

const ENABLERS = ['tailwindcss'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['tailwind.config.{js,cjs,mjs,ts}'];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;
  return config.entry ? config.entry.map(toEntryPattern) : ENTRY_FILE_PATTERNS.map(toEntryPattern);
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};

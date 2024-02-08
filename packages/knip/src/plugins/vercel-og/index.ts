import { hasDependency } from '../../util/plugin.js';
import { toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://vercel.com/docs/functions/og-image-generation

const NAME = 'Vercel OG';

const ENABLERS = ['next', '@vercel/og'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const PRODUCTION_ENTRY_FILE_PATTERNS = [
  '{src/,}pages/api/og.{jsx,tsx}',
  '{src/,}app/api/og/route.{jsx,tsx}',
  // 'api/og.{jsx,tsx}', // TODO maybe add for non-Next.js projects
];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern);
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  findDependencies,
};

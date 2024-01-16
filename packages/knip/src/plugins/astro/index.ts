import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://docs.astro.build/en/reference/configuration-reference/

const NAME = 'Astro';

const ENABLERS = ['astro'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['astro.config.{js,cjs,mjs,ts}', 'src/content/config.ts'];

const PRODUCTION_ENTRY_FILE_PATTERNS = ['src/pages/**/*.{astro,mdx,js,ts}', 'src/content/**/*.mdx'];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config, manifest, isProduction } = options;

  const dependencies = config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];

  if (
    !isProduction &&
    manifest.scripts &&
    Object.values(manifest.scripts).some(script => /(?<=^|\s)astro(\s|\s.+\s)check(?=\s|$)/.test(script))
  ) {
    dependencies.push('@astrojs/check');
  }

  return dependencies;
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  findDependencies,
};

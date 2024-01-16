import { timerify } from '../../util/Performance.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import { CONFIG_FILE_PATTERNS as VITE_CONFIG_FILE_PATTERNS } from '../vite/index.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://kit.svelte.dev/docs

const NAME = 'Svelte';

const ENABLERS = ['svelte'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = ['svelte.config.js', ...VITE_CONFIG_FILE_PATTERNS];

const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'src/routes/**/+{page,server,page.server,error,layout,layout.server}{,@*}.{js,ts,svelte}',
  'src/hooks.{server,client}.{js,ts}',
  'src/params/*{js,ts}',
];

const PROJECT_FILE_PATTERNS = ['src/**/*.{js,ts,svelte}'];

const findSvelteDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern), ...PRODUCTION_ENTRY_FILE_PATTERNS.map(toProductionEntryPattern)];
};

const findDependencies = timerify(findSvelteDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  PRODUCTION_ENTRY_FILE_PATTERNS,
  PROJECT_FILE_PATTERNS,
  findDependencies,
};

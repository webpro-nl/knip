import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern, toProductionEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://mswjs.io/docs/integrations/browser

const NAME = 'Mock Service Worker';

const ENABLERS = ['msw'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const ENTRY_FILE_PATTERNS = [
  '**/mockServiceWorker.{js,ts}',
  'mocks/browser.{js,ts}',
  'mocks/handlers.{js,ts}"',
  'mocks/index.{js,ts}"',
  'mocks/server.{js,ts}"',
];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { config } = options;

  return config.entry
    ? config.entry.map(toProductionEntryPattern)
    : [...ENTRY_FILE_PATTERNS.map(toEntryPattern)];
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};

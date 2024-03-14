import { join } from '../../util/path.js';
import { basename } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { MSWConfig } from './types.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://mswjs.io/docs/integrations/browser

const NAME = 'Mock Service Worker';

const ENABLERS = ['msw'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['package.json'];

const ENTRY_FILE_PATTERNS = ['mockServiceWorker.js'];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest } = options;

  // @ts-expect-error Bug in TS? (see other plugins with `await load`)
  const localConfig: MSWConfig | undefined = basename(configFilePath) === 'package.json' ? manifest.msw : undefined;

  const workerDirectory = localConfig?.workerDirectory ?? '.';

  return ENTRY_FILE_PATTERNS.map(pattern => toEntryPattern(join(workerDirectory, pattern)));
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};

// eslint-disable-next-line n/no-restricted-import
import path from 'node:path';
import { basename } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { GenericPluginCallback, IsPluginEnabledCallback } from '../../types/plugins.js';

// https://mswjs.io/docs/integrations/browser

const NAME = 'Mock Service Worker';

const ENABLERS = ['msw'];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['package.json'];

const ENTRY_FILE_PATTERNS = [
  'mockServiceWorker.js',
];

const findDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { manifest, isProduction } = options;

  const localConfig = basename(configFilePath) === 'package.json' ? manifest.msw : undefined;
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  const workerDirectory = localConfig?.workerDirectory;

  if (workerDirectory) {
    return [toEntryPattern(path.join(workerDirectory, '/mockServiceWorker.js'))];
  }

  const entryPatterns =  ENTRY_FILE_PATTERNS.map(toEntryPattern);

  if (isProduction) return entryPatterns;

  return [...entryPatterns];
};

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  ENTRY_FILE_PATTERNS,
  findDependencies,
};

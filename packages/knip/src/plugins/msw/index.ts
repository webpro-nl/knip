import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { toEntryPattern } from '../../util/protocols.js';
import type { MSWConfig } from './types.js';
import type { IsPluginEnabled, ResolveEntryPaths } from '../../types/plugins.js';

// https://mswjs.io/docs/integrations/browser

const title = 'Mock Service Worker';

const enablers = ['msw'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const entry = ['mockServiceWorker.js'];

const resolveEntryPaths: ResolveEntryPaths<MSWConfig> = async localConfig => {
  const workerDirectory = localConfig?.workerDirectory ?? '.';
  return entry.map(pattern => toEntryPattern(join(workerDirectory, pattern)));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
};

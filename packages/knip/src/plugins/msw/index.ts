import { join } from '#p/util/path.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '#p/types/plugins.js';
import type { MSWConfig } from './types.js';

// https://mswjs.io/docs/integrations/browser

const title = 'Mock Service Worker';

const enablers = ['msw'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const entry = ['mockServiceWorker.js'];

const resolveEntryPaths: ResolveEntryPaths<MSWConfig> = async localConfig => {
  const workerDirectory = localConfig?.workerDirectory;
  const dir = workerDirectory ? [workerDirectory].flat()[0] : '.';
  return entry.map(pattern => toEntryPattern(join(dir, pattern)));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveEntryPaths,
} satisfies Plugin;

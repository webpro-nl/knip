import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { MSWConfig } from './types.js';

// https://mswjs.io/docs/integrations/browser

const title = 'Mock Service Worker';

const enablers = ['msw'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const entry = ['mockServiceWorker.js'];

const resolveConfig: ResolveConfig<MSWConfig> = async localConfig => {
  const workerDirectory = localConfig?.workerDirectory;
  const dir = workerDirectory ? [workerDirectory].flat()[0] : '.';
  return entry.map(pattern => toEntry(join(dir, pattern)));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
};

export default plugin;

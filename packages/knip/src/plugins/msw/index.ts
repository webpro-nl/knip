import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MSWConfig } from './types.ts';

// https://mswjs.io/docs/integrations/browser

const title = 'Mock Service Worker';

const enablers = ['msw'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['package.json'];

const entry = ['mockServiceWorker.js'];

const resolveConfig: ResolveConfig<MSWConfig> = async localConfig => {
  const dirs = localConfig?.workerDirectory ? [localConfig.workerDirectory].flat() : ['.'];
  const inputs = [];
  for (const dir of dirs) for (const pattern of entry) inputs.push(toEntry(join(dir, pattern)));
  return inputs;
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

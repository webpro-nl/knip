import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '#p/types/plugins.js';
import type { WranglerConfig } from './types.js';

// https://developers.cloudflare.com/workers/wrangler/configuration/

const title = 'Wrangler';

const enablers = ['wrangler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wrangler.{json,toml}'];

const resolveEntryPaths: ResolveEntryPaths<WranglerConfig> = async config => {
  return config.main ? [config.main] : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
} satisfies Plugin;

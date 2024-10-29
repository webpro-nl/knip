import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { WranglerConfig } from './types.js';

// https://developers.cloudflare.com/workers/wrangler/configuration/

const title = 'Wrangler';

const enablers = ['wrangler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wrangler.{json,toml}'];

const resolveEntryPaths: ResolveEntryPaths<WranglerConfig> = async config => {
  return (config.main ? [config.main] : []).map(id => toProductionEntry(id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
} satisfies Plugin;

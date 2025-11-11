import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { WranglerConfig } from './types.js';

// https://developers.cloudflare.com/workers/wrangler/configuration/

const title = 'Wrangler';

const enablers = ['wrangler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wrangler.{json,toml}'];

const resolveConfig: ResolveConfig<WranglerConfig> = async config => {
  return (config.main ? [config.main] : []).map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toEntryPath } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { WranglerConfig } from './types.ts';

// https://developers.cloudflare.com/workers/wrangler/configuration/

const title = 'Wrangler';

const enablers = ['wrangler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wrangler.{json,jsonc,toml}'];

const resolveConfig: ResolveConfig<WranglerConfig> = async config => {
  return (config.main ? [config.main] : []).map(id => toEntryPath(id, { production: true }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { ReleaseItConfig } from './types.js';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin
// Uses CosmiConfig but with custom searchPlaces
// https://github.com/release-it/release-it/blob/main/lib/config.js

const title = 'Release It!';

const enablers = ['release-it'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.release-it.{json,js,cjs,ts,yml,yaml,toml}', 'package.json'];

const resolveConfig: ResolveConfig<ReleaseItConfig> = (config, options) => {
  const plugins = config.plugins ? Object.keys(config.plugins) : [];
  const scripts = config.hooks ? Object.values(config.hooks).flat() : [];
  if (typeof config.github?.releaseNotes === 'string') {
    scripts.push(config.github.releaseNotes);
  }
  if (typeof config.gitlab?.releaseNotes === 'string') {
    scripts.push(config.gitlab.releaseNotes);
  }
  const inputs = options.getInputsFromScripts(scripts);

  return [...plugins.map(id => toDependency(id)), ...inputs];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { ReleaseItConfig } from './types.ts';

// https://github.com/release-it/release-it/blob/master/docs/plugins.md#using-a-plugin
// Loads `.release-it` with c12, which accepts any of its supported extensions
// https://github.com/release-it/release-it/blob/main/lib/config.js

const title = 'Release It!';

const enablers = ['release-it'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.release-it.{json,jsonc,json5,js,mjs,cjs,ts,mts,cts,yml,yaml,toml}', 'package.json'];

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

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

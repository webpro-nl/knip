import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/solidjs/filesystem-routing
// https://github.com/solidjs/filesystem-routing/blob/90a19eeb5c58becb0b5d599527c99452eab6f1c5/src/vite/index.ts

const title = 'filesystem-routing';

const enablers = ['filesystem-routing'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const production = ['src/routes/**/*.{js,jsx,ts,tsx,tsrx}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
};

export default plugin;

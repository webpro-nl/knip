import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/svg/svgo
// https://github.com/svg/svgo/blob/main/lib/svgo-node.js

const title = 'SVGO';

const enablers = ['svgo', '@svgr/plugin-svgo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['svgo.config.{js,cjs,mjs}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;

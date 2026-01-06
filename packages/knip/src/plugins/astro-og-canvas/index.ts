import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/delucis/astro-og-canvas

const title = 'astro-og-canvas';

const enablers = ['astro-og-canvas'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolve: Resolve = async () => {
  return [toDependency('astro-og-canvas')];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;

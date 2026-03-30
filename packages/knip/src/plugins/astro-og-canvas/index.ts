import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://github.com/delucis/astro-og-canvas

const title = 'astro-og-canvas';

const enablers = ['astro-og-canvas'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolve: Resolve = async () => {
  return [toDependency('canvaskit-wasm', { optional: true })];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;

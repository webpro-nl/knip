import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PluginConfig } from './types.js';

// https://github.com/delucis/astro-og-canvas

const title = 'astro-og-canvas';

const enablers = ['astro-og-canvas'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolveConfig: ResolveConfig<PluginConfig> = async config => {
  const inputs = config?.plugins ?? [];
  return [
    ...inputs.map(id => toDeferResolve(id)),
    toDependency('canvaskit-wasm', { optional: true }),
  ];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolveConfig,
};

export default plugin;

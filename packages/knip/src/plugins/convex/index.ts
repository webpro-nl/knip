import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.convex.dev/home

const title = 'Convex';

const enablers = ['convex'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry: string[] = ['convex/*.config.@(js|ts)', 'convex/_generated/*.@(js|ts)'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;

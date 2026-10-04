import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

const title = 'Hono';
const enablers = ['hono'];
const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
};

export default plugin;

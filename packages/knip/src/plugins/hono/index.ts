import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

const title = 'Hono';
const enablers = ['hono'];
const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);
const entry = [
  'src/index.{js,cjs,mjs,ts,cts,mts,jsx,tsx}',
  'src/server.{js,cjs,mjs,ts,cts,mts,jsx,tsx}',
  'server.{js,cjs,mjs,ts,cts,mts,jsx,tsx}',
];
const production = entry;

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};

export default plugin;

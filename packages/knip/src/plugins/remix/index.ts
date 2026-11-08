import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://remix.run/docs/en/v1/api/conventions
// https://github.com/remix-run/remix/blob/remix%402.17.5/packages/remix-dev/config.ts

const title = 'Remix';

const enablers = ['@remix-run/dev'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['remix.config.{js,cjs,mjs}', 'remix.init/index.js'];

const production = [
  'app/root.{js,jsx,ts,tsx}',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,jsx,ts,tsx}',
  'server.{js,ts}',
];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};

export default plugin;

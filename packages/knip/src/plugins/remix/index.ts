import { hasDependency } from '#p/util/plugin.js';
import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://remix.run/docs/en/v1/api/conventions

const title = 'Remix';

const enablers = [/^@remix-run\//];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['remix.config.js', 'remix.init/index.js'];

const production = [
  'app/root.tsx',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,ts,tsx}',
  'server.{js,ts}',
];

export default {
  title,
  enablers,
  isEnabled,
  entry,
  production,
};

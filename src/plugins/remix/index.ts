import { hasDependency } from '../../util/plugin.js';
import type { IsPluginEnabledCallback } from '../../types/plugins.js';

// https://remix.run/docs/en/v1/api/conventions

export const NAME = 'Remix';

/** @public */
export const ENABLERS = [/^@remix-run\//];

export const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

export const ENTRY_FILE_PATTERNS = ['remix.config.js', 'remix.init/index.js'];

export const PRODUCTION_ENTRY_FILE_PATTERNS = [
  'app/root.tsx',
  'app/entry.{client,server}.{js,jsx,ts,tsx}',
  'app/routes/**/*.{js,ts,tsx}',
  'server.{js,ts}',
];

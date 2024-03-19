import { hasDependency } from '#p/util/plugin.js';
import { resolveEntryPaths, resolveConfig } from '../vitest/index.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite*.config.{js,mjs,ts,cjs,mts,cts}'];

const production: string[] = [];

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

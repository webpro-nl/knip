import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import { resolveConfig, resolveEntryPaths } from '../vitest/index.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

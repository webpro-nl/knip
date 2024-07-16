import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';
import { toEntryPattern } from '#p/util/protocols.js';
import { resolveConfig, resolveEntryPaths } from '../vitest/index.js';
import type { ViteConfigOrFn, VitestWorkspaceConfig } from '../vitest/types.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite*.config.{js,mjs,ts,cjs,mts,cts}'];

const production: string[] = [];

const viteResolveEntryPaths: ResolveEntryPaths<ViteConfigOrFn | VitestWorkspaceConfig> = async (
  localConfig,
  options
) => {
  const vitestEntryPaths = await resolveEntryPaths(localConfig, options);

  return [...vitestEntryPaths, toEntryPattern('src/vite-env.d.ts')];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveEntryPaths: viteResolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

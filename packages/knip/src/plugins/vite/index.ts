import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getDependenciesFromConfig } from '../babel/index.js';
import type { BabelConfigObj } from '../babel/types.js';
import { findConfigDependencies, getConfigs, resolveEntryPaths } from '../vitest/index.js';
import type { ViteConfig, ViteConfigOrFn, VitestWorkspaceConfig } from '../vitest/types.js';
import type { BabelPlugin } from './types.js';

// https://vitejs.dev/config/

const title = 'Vite';

const enablers = ['vite', 'vitest'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

export const config = ['vite.config.{js,mjs,ts,cjs,mts,cts}'];

const hasReactBabelPlugins = (config: ViteConfig) => {
  if (!config?.plugins?.length) {
    return false;
  }

  for (const plugin of config.plugins) {
    if (typeof plugin === 'function') {
      const pluginConfig = plugin() as BabelPlugin;
      if (pluginConfig?.babel?.plugins) {
        return true;
      }
    } else if (Array.isArray(plugin)) {
      const [pluginObj] = plugin as [BabelPlugin];
      if (pluginObj?.babel?.plugins) {
        return true;
      }
    } else if (typeof plugin === 'object' && plugin !== null) {
      const pluginObj = plugin as BabelPlugin;
      if (pluginObj?.babel?.plugins) {
        return true;
      }
    }
  }

  return false;
};

const resolveConfig: ResolveConfig<ViteConfigOrFn | VitestWorkspaceConfig> = async (localConfig, options) => {
  const inputs = new Set<Input>();
  const configs = await getConfigs(localConfig);
  for (const cfg of configs) {
    for (const dependency of findConfigDependencies(cfg, options)) inputs.add(dependency);
    if (hasReactBabelPlugins(cfg)) {
      const babelPlugins = getDependenciesFromConfig((cfg as { plugins: BabelConfigObj }).plugins);
      for (const plugin of babelPlugins) inputs.add(plugin);
    }
    const entry = cfg.build?.lib?.entry ?? [];
    const dir = join(options.configFileDir, cfg.test?.root ?? '.');
    const deps = (typeof entry === 'string' ? [entry] : Object.values(entry))
      .map(specifier => join(dir, specifier))
      .map(toEntry);
    for (const dependency of deps) inputs.add(dependency);
  }
  return Array.from(inputs);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig, ResolveEntryPaths } from '../../types/config.js';
import { toProductionEntry } from '../../util/input.js';
import { join } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import { getConfig, getDependencies } from './helpers.js';
import type { ExpoConfig } from './types.js';

// https://docs.expo.dev/

const title = 'Expo';

const enablers = ['expo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['app.json', 'app.config.{ts,js}'];

const production = ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'];

/** @public */
export const docs = { production };

const resolveEntryPaths: ResolveEntryPaths<ExpoConfig> = async (localConfig, options) => {
  const { manifest } = options;
  const config = getConfig(localConfig, options);

  // https://docs.expo.dev/router/installation/#setup-entry-point
  if (manifest.main === 'expo-router/entry') {
    let patterns = [...production];

    const normalizedPlugins =
      config.plugins?.map(plugin => (Array.isArray(plugin) ? plugin : ([plugin] as const))) ?? [];
    const expoRouterPlugin = normalizedPlugins.find(([plugin]) => plugin === 'expo-router');

    if (expoRouterPlugin) {
      const [, options] = expoRouterPlugin;

      if (typeof options?.root === 'string') {
        patterns = [join(options.root, '**/*.{js,jsx,ts,tsx}')];
      }
    }

    return patterns.map(entry => toProductionEntry(entry));
  }

  return production.map(entry => toProductionEntry(entry));
};

const resolveConfig: ResolveConfig<ExpoConfig> = async (expoConfig, options) => getDependencies(expoConfig, options);

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  resolveConfig,
} satisfies Plugin;

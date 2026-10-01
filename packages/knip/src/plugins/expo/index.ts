import type { IsPluginEnabled, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { toConfig, toIgnore, toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { getConfig, getDependencies } from './helpers.ts';
import type { ExpoConfig } from './types.ts';

// https://docs.expo.dev/

const title = 'Expo';

const enablers = ['expo'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['app.json', 'app.config.{ts,js}'];

const production = ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'];

// https://docs.expo.dev/versions/latest/config/babel/
const resolve: Resolve = () => [toConfig('babel', 'babel.config'), toIgnore('babel-preset-expo', 'unresolved')];

const resolveConfig: ResolveConfig<ExpoConfig> = async (localConfig, options) => {
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

    return patterns.map(entry => toProductionEntry(entry)).concat(await getDependencies(localConfig, options));
  }

  return production.map(entry => toProductionEntry(entry)).concat(await getDependencies(localConfig, options));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolve,
  resolveConfig,
};

export default plugin;

import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import expo from '../expo/index.ts';
import { getConfig } from '../expo/helpers.ts';
import type { ExpoConfig } from '../expo/types.ts';

// https://docs.expo.dev/router/introduction/
// https://docs.expo.dev/router/reference/src-directory/

const title = 'Expo Router';

const enablers = ['expo-router'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = expo.config;

const production = ['app/**/*.{js,jsx,ts,tsx}', 'src/app/**/*.{js,jsx,ts,tsx}'];

const resolveConfig: ResolveConfig<ExpoConfig> = async (localConfig, options) => {
  const config = getConfig(localConfig, options);

  for (const plugin of config.plugins ?? []) {
    if (!Array.isArray(plugin)) continue;
    const [name, pluginOptions] = plugin;
    const root = pluginOptions?.root;
    if (name === 'expo-router' && typeof root === 'string') {
      return [toProductionEntry(join(root, '**/*.{js,jsx,ts,tsx}'))];
    }
  }

  return production.map(id => toProductionEntry(id));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  production,
  resolveConfig,
};

export default plugin;

import type { PluginOptions, ResolveConfig } from '../../types/config.ts';
import { type Input, toEntryPath, toDependency } from '../../util/input.ts';
import { getPackageNameFromModuleSpecifier } from '../../util/modules.ts';
import { isInternal, join } from '../../util/path.ts';
import type { ExpoConfig } from './types.ts';

const getDummyConfigContext = (options: PluginOptions) => ({
  projectRoot: options.cwd,
  staticConfigPath: null,
  packageJsonPath: join(options.cwd, 'package.json'),
  config: {
    plugins: [],
  },
});

export const getConfig = (localConfig: ExpoConfig, options: PluginOptions) => {
  const expoConfig = typeof localConfig === 'function' ? localConfig(getDummyConfigContext(options)) : localConfig;
  return 'expo' in expoConfig ? expoConfig.expo : expoConfig;
};

// https://docs.expo.dev/versions/latest/config/app

export const getDependencies: ResolveConfig<ExpoConfig> = async (localConfig, options) => {
  const { manifest } = options;
  const config = getConfig(localConfig, options);

  const platforms = config.platforms ?? ['ios', 'android'];

  const inputs = new Set<Input>();

  for (const plugin of config.plugins ?? []) {
    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
    if (typeof pluginName !== 'string') continue;
    if (isInternal(pluginName)) {
      inputs.add(toEntryPath(pluginName));
    } else {
      const packageName = getPackageNameFromModuleSpecifier(pluginName);
      if (packageName) inputs.add(toDependency(packageName));
    }
  }

  const allowedPackages = ['expo-atlas', 'expo-dev-client'];
  const allowedProductionPackages = ['expo-insights'];

  const manifestDependencies = Object.keys(manifest.dependencies ?? {});

  for (const pkg of allowedPackages) {
    if (manifestDependencies.includes(pkg)) {
      inputs.add(toDependency(pkg));
    }
  }

  for (const pkg of allowedProductionPackages) {
    if (manifestDependencies.includes(pkg)) {
      inputs.add(toDependency(pkg, { production: true }));
    }
  }

  if (config.updates?.enabled !== false) {
    inputs.add(toDependency('expo-updates', { production: true }));
  }

  if (config.notification) {
    inputs.add(toDependency('expo-notifications', { production: true }));
  }

  const isExpoRouter = manifest.main === 'expo-router/entry';

  // https://docs.expo.dev/router/installation/#setup-entry-point
  if (isExpoRouter) {
    inputs.add(toDependency('expo-router', { production: true }));
  }

  // https://docs.expo.dev/workflow/web/#install-web-dependencies
  if (platforms.includes('web')) {
    inputs.add(toDependency('react-native-web', { production: true }));
    inputs.add(toDependency('react-dom', { production: true }));

    // https://github.com/expo/expo/tree/main/packages/@expo/metro-runtime
    if (!isExpoRouter && !options.enabledPlugins.includes('expo-router')) {
      inputs.add(toDependency('@expo/metro-runtime'));
    }
  }

  if (
    (platforms.includes('android') && (config.userInterfaceStyle || config.android?.userInterfaceStyle)) ||
    (platforms.includes('ios') && (config.backgroundColor || config.ios?.backgroundColor))
  ) {
    inputs.add(toDependency('expo-system-ui', { production: true }));
  }

  if (platforms.includes('android') && config.androidNavigationBar) {
    inputs.add(toDependency('expo-navigation-bar', { production: true }));
  }

  return [...inputs];
};

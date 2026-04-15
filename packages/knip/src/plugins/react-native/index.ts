import type { IsPluginEnabled, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { type Input, toDependency } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { ReactNativeConfig } from './types.ts';

// https://github.com/react-native-community/cli/blob/main/docs/configuration.md

const title = 'React Native';

const enablers = ['react-native'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['react-native.config.js'];

const RN_CLI_PACKAGES = [
  '@react-native-community/cli',
  '@react-native-community/cli-platform-android',
  '@react-native-community/cli-platform-ios',
];

const resolveConfig: ResolveConfig<ReactNativeConfig> = async config => {
  const inputs: Input[] = [];

  if (config.dependencies) {
    for (const name of Object.keys(config.dependencies)) {
      inputs.push(toDependency(name));
    }
  }

  if (config.platforms) {
    for (const platform of Object.values(config.platforms)) {
      if (platform.npmPackageName) inputs.push(toDependency(platform.npmPackageName));
    }
  }

  return inputs;
};

const resolve: Resolve = () => {
  return RN_CLI_PACKAGES.map(pkg => toDependency(pkg, { optional: true }));
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  resolve,
};

export default plugin;

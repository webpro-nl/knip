import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { type Input, toDependency } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { ReactNativeConfig } from './types.js';

// https://github.com/react-native-community/cli/blob/main/docs/configuration.md

const title = 'React Native';

const enablers = ['react-native', '@react-native-community/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['react-native.config.{js,cjs,ts,mjs}'];

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

  for (const pkg of RN_CLI_PACKAGES) {
    inputs.push(toDependency(pkg, { optional: true }));
  }

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};

export default plugin;

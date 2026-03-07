// https://github.com/react-native-community/cli/blob/main/docs/configuration.md

export type ReactNativeConfig = {
  reactNativePath?: string;
  dependencies?: Record<string, unknown>;
  platforms?: Record<string, { npmPackageName?: string }>;
};

// https://github.com/expo/expo/blob/main/packages/%40expo/config-types/src/ExpoConfig.ts
// https://github.com/expo/expo/blob/main/packages/%40expo/config/src/Config.types.ts

type BaseConfig = {
  platforms?: ('ios' | 'android' | 'web')[];
  notification?: Record<string, unknown>;
  updates?: {
    enabled?: boolean;
  };
  backgroundColor?: string;
  userInterfaceStyle?: 'automatic' | 'light' | 'dark';
  ios?: {
    backgroundColor?: string;
  };
  android?: {
    userInterfaceStyle?: 'automatic' | 'light' | 'dark';
  };
  androidNavigationBar?: Record<string, unknown>;
  plugins?: (string | [string, Record<string, unknown>])[];
};

type ConfigContext = {
  projectRoot: string;
  staticConfigPath: string | null;
  packageJsonPath: string | null;
  config: Partial<BaseConfig>;
};

type ExpoConfigOrProp = BaseConfig | { expo: BaseConfig };

export type ExpoConfig = ExpoConfigOrProp | ((cfg: ConfigContext) => ExpoConfigOrProp);

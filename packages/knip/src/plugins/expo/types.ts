// https://github.com/expo/expo/blob/main/packages/%40expo/config-types/src/ExpoConfig.ts

type AppConfig = {
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

export type ExpoConfig = AppConfig | { expo: AppConfig };

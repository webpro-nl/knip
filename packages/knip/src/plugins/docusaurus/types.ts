export type ModuleType = 'plugin' | 'theme' | 'preset';

export type ConfigItem = string | [string, { [key: string]: unknown }] | false | null;

export type DocusaurusConfig = {
  title: string;
  url: string;
  themes?: ConfigItem[];
  plugins?: ConfigItem[];
  presets: ConfigItem[];
};

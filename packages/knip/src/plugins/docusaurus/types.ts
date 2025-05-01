export type ModuleType = 'plugin' | 'theme' | 'preset';

type DocsConfig = {
  sidebarPath?: string;
  [key: string]: unknown;
};

export type PluginOptions = {
  sidebarPath?: string;
  [key: string]: unknown;
};

export type PresetOptions = {
  docs?: DocsConfig;
  [key: string]: unknown;
};

type PluginConfig = string | [string, PluginOptions] | false | null;
type PresetConfig = string | [string, PresetOptions] | false | null;

export type ConfigItem = PresetConfig | PluginConfig;

export type DocusaurusConfig = {
  title: string;
  url: string;
  themes?: PluginConfig[];
  plugins?: PluginConfig[];
  presets: PresetConfig[];
};

export type ResolveResult = {
  dependencies: string[];
  entries?: string[];
};

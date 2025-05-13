import type { WebpackConfig } from '../webpack/types.js';

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

type Loader = unknown;

type PluginConfig =
  | string
  | [string, PluginOptions]
  | false
  | null
  | {
      name?: string;
      configureWebpack?: (
        config?: PluginConfig,
        isServer?: boolean,
        utils?: {
          getStyleLoaders(isServer: boolean, cssOptions: { [key: string]: any }): Loader[];
          // biome-ignore lint/complexity/noBannedTypes: deal with it
          getJSLoader(isServer: boolean, cacheOptions?: {}): Loader | null;
        },
        content?: unknown
      ) => WebpackConfig;
      configurePostCss?: (postcssOptions: { plugins: unknown[] }) => { plugins: unknown[] };
    };

type PresetConfig = string | [string, PresetOptions] | false | null;

type Config = PresetConfig | PluginConfig;

export type ConfigItem = Config | (() => Config);

export type DocusaurusConfig = {
  title: string;
  url: string;
  themes?: PluginConfig[];
  plugins?: PluginConfig[];
  presets: PresetConfig[];
};

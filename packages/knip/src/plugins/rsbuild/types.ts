import type { Configuration } from 'webpack';

type EntryDescription = Record<string, unknown>;

type Entry = Record<string, string | string[] | (EntryDescription & { html?: boolean })>;

type RspackConfigUtils = {
  env: string;
  isDev: boolean;
  isProd: boolean;
  target: 'web' | 'node' | 'web-worker';
  isServer: boolean;
  isWebWorker: boolean;
};

type RspackConfig =
  | Configuration
  | ((config: Configuration, utils: RspackConfigUtils) => Configuration | void | Promise<Configuration | void>);

export type RsbuildConfig = {
  plugins?: unknown[];
  mode?: 'development' | 'production' | 'none';
  output?: { target?: RspackConfigUtils['target'] };
  source?: { entry?: Entry; preEntry?: string | string[] };
  tools?: {
    rspack?: RspackConfig | RspackConfig[];
  };
  environments?: {
    [k: string]: Omit<RsbuildConfig, 'environments'>;
  };
};

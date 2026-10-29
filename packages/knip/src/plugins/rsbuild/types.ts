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

type AliasObject = Record<string, string | false | (string | false)[]>;

type Alias = AliasObject | ((aliases: AliasObject) => AliasObject | void);

export type AliasChain = Alias | Alias[];

export type RsbuildConfig = {
  plugins?: unknown[];
  mode?: 'development' | 'production' | 'none';
  output?: { target?: RspackConfigUtils['target'] };
  resolve?: { alias?: AliasChain };
  source?: { entry?: Entry; preEntry?: string | string[] };
  tools?: {
    rspack?: RspackConfig | RspackConfig[];
  };
  environments?: {
    [k: string]: Omit<RsbuildConfig, 'environments'>;
  };
};

export type ConfigParams = { env: string; command: string; envMode: string };

export type RsbuildConfigOrFn = RsbuildConfig | ((params: ConfigParams) => RsbuildConfig | Promise<RsbuildConfig>);

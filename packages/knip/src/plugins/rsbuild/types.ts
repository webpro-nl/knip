import type { Configuration } from 'webpack';

type EntryDescription = Record<string, unknown>;

type Entry = Record<string, string | string[] | (EntryDescription & { html?: boolean })>;

export type RsbuildConfig = {
  plugins?: unknown[];
  source?: { entry?: Entry; preEntry?: string | string[] };
  tools?: {
    rspack?: Configuration | ((config: Configuration) => Configuration | void | Promise<Configuration | void>);
  };
  environments?: {
    [k: string]: Pick<RsbuildConfig, 'plugins' | 'source' | 'tools'>;
  };
};

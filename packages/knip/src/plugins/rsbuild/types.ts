type EntryDescription = Record<string, unknown>;

type Entry = Record<string, string | string[] | (EntryDescription & { html?: boolean })>;

export type RsbuildConfig = {
  plugins?: unknown[];
  source?: { entry?: Entry; preEntry?: string | string[] };
  environments?: {
    [k: string]: Pick<RsbuildConfig, 'plugins' | 'source'>;
  };
};

type ConfigParams = { env: string; command: string; envMode: string };

export type RsbuildConfigOrFn = RsbuildConfig | ((params: ConfigParams) => RsbuildConfig | Promise<RsbuildConfig>);

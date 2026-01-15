type EntryDescription = Record<string, unknown>;

type Entry = Record<string, string | string[] | (EntryDescription & { html?: boolean })>;

export type RsbuildConfig = {
  plugins?: unknown[];
  source?: { entry?: Entry; preEntry?: string | string[] };
  environments?: {
    [k: string]: Pick<RsbuildConfig, 'plugins' | 'source'>;
  };
};

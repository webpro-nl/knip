type EntryDescription = Record<string, unknown>;

type Entry = Record<string, string | string[] | (EntryDescription & { html?: boolean })>;

export type RsbuildConfig = {
  plugins?: unknown[];
  source?: { entry?: Entry; preEntry?: string | string[] };
  environments?: {
    [k: string]: Pick<RsbuildConfig, 'plugins' | 'source'>;
  };
};

export type RsbuildEnv = {
  command: 'dev' | 'build' | 'preview' | 'inspect';
  envMode?: string;
  meta?: { fileUrl: string };
};

export type RsbuildConfigFn = (env: RsbuildEnv) => RsbuildConfig | Promise<RsbuildConfig>;

export type RsbuildConfigExport = RsbuildConfig | RsbuildConfigFn;

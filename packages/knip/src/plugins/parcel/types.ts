export type ParcelConfig = {
  extends?: string | string[];
  resolvers?: string | string[];
  transformers?: Record<string, string | string[]>;
  bundler?: string;
  namers?: string | string[];
  runtimes?: Record<string, string | string[]>;
  packagers?: Record<string, string | string[]>;
  optimizers?: Record<string, string | string[]>;
  compressors?: Record<string, string | string[]>;
  reporters?: string | string[];
  validators?: Record<string, string | string[]>;
};

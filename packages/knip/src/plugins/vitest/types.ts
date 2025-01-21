interface VitestConfig {
  test: {
    include: string[];
    coverage?: {
      enabled?: boolean;
      provider: string;
    };
    root?: string;
    environment?: string;
    globalSetup?: string | string[];
    reporters?: (string | [string, unknown] | unknown)[];
    setupFiles?: string | string[];
  };
}

export interface ViteConfig extends VitestConfig {
  plugins?: unknown[];
  build?: {
    lib?: {
      entry: string | string[] | { [entryAlias: string]: string };
    };
  };
}

export type COMMAND = 'dev' | 'serve' | 'build';
export type MODE = 'development' | 'production';

interface Options {
  command: COMMAND;
  mode: MODE;
  ssrBuild?: boolean | undefined;
}

export type ViteConfigOrFn =
  | ViteConfig
  | ((options: Options) => ViteConfig)
  | ((options: Options) => Promise<ViteConfig>);

export type VitestWorkspaceConfig = (string | ViteConfig)[];

interface Alias {
  find: string | RegExp;
  replacement: string;
  customResolver?: any;
}

export type AliasOptions = readonly Alias[] | { [find: string]: string };

interface VitestConfig {
  test: {
    include: string[];
    benchmark?: {
      include?: string[];
    };
    coverage?: {
      enabled?: boolean;
      provider: string;
    };
    root?: string;
    environment?: string;
    globalSetup?: string | string[];
    reporters?: (string | [string, unknown] | unknown)[];
    setupFiles?: string | string[];
    snapshotSerializers?: string[];
    workspace?: (ViteConfig & { test: VitestConfig['test'] & { workspace: never } })[];
    projects?: (string | (ViteConfig & { test: VitestConfig['test'] & { projects: never } }))[];
    alias?: AliasOptions;
  };
}

export interface ViteConfig extends VitestConfig {
  extends?: string | true;
  root?: string;
  plugins?: unknown[];
  build?: {
    lib?: {
      entry: string | string[] | { [entryAlias: string]: string };
    };
  };
  optimizeDeps?: {
    include?: string[];
  };
  ssr?: {
    external?: (string | RegExp)[] | true;
  };
  resolve?: {
    alias?: AliasOptions;
    dedupe?: string[];
    extensions?: string[];
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

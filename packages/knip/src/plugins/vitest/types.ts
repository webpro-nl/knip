import type { OxlintConfig } from '../oxlint/types.ts';

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
    dir?: string;
    environment?: string;
    globalSetup?: string | string[];
    reporters?: (string | [string, unknown] | unknown)[];
    setupFiles?: string | string[];
    snapshotSerializers?: string[];
    workspace?: (ViteConfig & { test: VitestConfig['test'] & { workspace: never } })[];
    projects?: (string | VitestProject)[];
    alias?: AliasOptions;
  };
}

export interface ViteConfig extends VitestConfig {
  lint?: OxlintConfig;
  extends?: string | true;
  root?: string;
  publicDir?: string | false;
  plugins?: unknown[];
  build?: {
    rolldownOptions?: {
      input?: string | string[] | { [entryAlias: string]: string | string[] };
    };
    rollupOptions?: {
      input?: string | string[] | { [entryAlias: string]: string | string[] };
    };
    lib?: {
      entry: string | string[] | { [entryAlias: string]: string | string[] };
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

export type COMMAND = 'serve' | 'build';
export type MODE = 'development' | 'production' | 'test';

export interface Options {
  command: COMMAND;
  mode: MODE;
  isSsrBuild?: boolean | undefined;
  ssrBuild?: boolean | undefined;
  isPreview?: boolean | undefined;
}

export type ViteConfigOrFn =
  | ViteConfig
  | ((options: Options) => ViteConfig)
  | ((options: Options) => Promise<ViteConfig>);

export type VitestProjectConfig = ViteConfig & { test: VitestConfig['test'] & { projects: never } };

export type VitestProject =
  | VitestProjectConfig
  | Promise<VitestProjectConfig>
  | ((options: Options) => VitestProjectConfig | Promise<VitestProjectConfig>);

export type VitestWorkspaceConfig = (string | ViteConfig)[];

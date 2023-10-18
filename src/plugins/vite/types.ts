import type { VitestConfig } from '../vitest/types.js';

interface Config extends VitestConfig {
  plugins: unknown[];
}

export type COMMAND = 'dev' | 'serve' | 'build';
export type MODE = 'development' | 'production';

interface Options {
  command: COMMAND;
  mode: MODE;
  ssrBuild?: boolean | undefined;
}

export type ViteConfig = Config | ((options: Options) => Config) | ((options: Options) => Promise<Config>);

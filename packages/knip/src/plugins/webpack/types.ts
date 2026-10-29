import type { Configuration, ProvidePlugin } from 'webpack';

type Mode = 'none' | 'development' | 'production';
export type Env = { production: boolean; mode: Mode };
export type Argv = { mode: Mode };
export type { ProvidePlugin };

export type SwcOptions = { jsc?: { experimental?: { plugins?: unknown[] } } };

type Configurations = Configuration | Configuration[];

export type WebpackConfig =
  | Configurations
  | ((env: Env, argv: Argv) => Configurations)
  | (() => Promise<Configuration>);

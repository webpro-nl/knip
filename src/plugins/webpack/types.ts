import type { Configuration } from 'webpack';

type Mode = 'none' | 'development' | 'production';
export type Env = { production: boolean };
export type Argv = { mode: Mode };

export type WebpackConfig = Configuration | ((env: Env, argv: Argv) => Configuration);

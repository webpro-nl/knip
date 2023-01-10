import type { Configuration } from 'webpack';

type Mode = 'none' | 'development' | 'production';
type Env = { production: boolean };
type Argv = { mode: Mode };

export type WebpackConfig = Configuration | ((env: Env, argv: Argv) => Configuration);

import type { Configuration } from 'webpack';

export type VueConfig = {
  configureWebpack?: Configuration | ((config: Configuration) => Configuration | undefined);
};

export type { Configuration as WebpackConfiguration };

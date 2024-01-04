import type { Configuration } from 'webpack';

export type VueConfig = {
  configureWebpack?: Configuration | ((config: Configuration) => Configuration | void);
};

export type { Configuration as WebpackConfiguration };

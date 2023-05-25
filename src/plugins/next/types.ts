import { WebpackConfig } from '../webpack/types.js';

type Options = {
  buildId: string;
  dev: boolean;
  isServer: boolean;
  defaultLoaders: Record<string, unknown>;
  nextRuntime: undefined | string;
};

export interface NextConfig {
  webpack: (config: WebpackConfig, options: Options) => WebpackConfig;
}

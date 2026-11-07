import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
  },
  cacheHandler: './cache/incremental.ts',
  cacheHandlers: {
    remote: './cache/remote.ts',
  },
};

export default nextConfig;

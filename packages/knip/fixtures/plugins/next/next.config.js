const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const withTM = require('next-transpile-modules')([]);

module.exports = phase => {
  const config = withTM({});
  return {
    pageExtensions: ['ts', 'tsx'],
    images: { loader: 'custom', loaderFile: './image-loader.js' },
    cacheHandler: './cache-handler.js',
    ...config,
  };
};

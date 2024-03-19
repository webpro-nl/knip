const getDefaultConfig = () => ({});
const mergeConfig = () => ({});
const defaultAssetExts = [];
const defaultSourceExts = [];

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: defaultAssetExts,
    sourceExts: [...defaultSourceExts, 'jsx'],
  },
};

module.exports = mergeConfig(defaultConfig, config);

module.exports.__KNIP_PLATFORMS__ = {
  ios: [
    ['/index', ''],
    ['.ios', '.native', ''],
  ],
  android: [
    ['/index', ''],
    ['.android', '.native', ''],
  ],
  desktop: [
    ['/index', ''],
    ['.desktop', ''],
  ],
  website: [
    ['/index', ''],
    ['.website', ''],
  ],
};

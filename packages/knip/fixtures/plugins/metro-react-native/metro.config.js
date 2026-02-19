require('@react-native/metro-config');

module.exports = {
  projectRoot: './src/app',
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
    babelTransformerPath: 'react-native-svg-transformer',
  },
};

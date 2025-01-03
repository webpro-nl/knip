module.exports = {
  projectRoot: './src/app',
  transformer: {
    minifierPath: 'metro-minify-esbuild',
    assetPlugins: ["expo-asset/tools/hashAssetFiles"],
    babelTransformerPath: 'react-native-svg-transformer'
  },
};

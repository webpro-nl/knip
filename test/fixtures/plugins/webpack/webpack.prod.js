const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const merge = require('./merge.js');
const common = require('./webpack.common.js');

module.exports = () =>
  merge(common(), {
    mode: 'production',
    module: {
      rules: [],
    },
    plugins: [new CopyWebpackPlugin()],
    optimization: {
      minimizer: [new TerserWebpackPlugin()],
    },
  });

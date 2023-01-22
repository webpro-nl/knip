const EslintPlugin = require('eslint-webpack-plugin');
const merge = require('./merge.js');
const common = require('./webpack.common.js');

module.exports = () =>
  merge(common(), {
    module: {
      rules: [
        {
          test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp)$/i,
          use: 'base64-inline-loader',
        },
      ],
    },
    plugins: [new EslintPlugin({ extensions: ['ts'], fix: true })],
  });

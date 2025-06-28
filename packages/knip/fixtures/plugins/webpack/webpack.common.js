const path = require('node:path');
const esbuild = require('esbuild');
const HtmlMinimizerPlugin = require('html-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = () => {
  return {
    module: {
      rules: [
        { test: /\.svg/, use: 'svg-url-loader' },
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env'], ['@babel/typescript', { jsxPragma: 'h' }]],
              plugins: [
                '@babel/proposal-class-properties',
                [
                  '@babel/plugin-transform-react-jsx',
                  {
                    pragma: 'h',
                    pragmaFrag: 'Fragment',
                  },
                ],
                'babel-plugin-macros',
                'babel-plugin-styled-components',
              ],
            },
          },
        },
        {
          test: /(\.ts)x|\.ts$/,
          use: () => [
            {
              loader: 'ts-loader',
            },
          ],
        },
        {
          test: /(\.js)x|\.js$/,
          loader: 'esbuild-loader',
          options: {
            implementation: esbuild,
          },
        },
        {
          test: /\.less$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'less-loader',
            },
          ],
        },
        info => ({
          loader: 'svgo-loader',
          options: {
            plugins: [
              {
                cleanupIDs: { prefix: path.basename(info.resource) },
              },
            ],
          },
        }),
        {
          test: /\.css$/,
          oneOf: [
            {
              resourceQuery: /inline/,
              loader: 'url-loader',
            },
            {
              resourceQuery: /external/,
              use: [
                {
                  loader: 'file-loader',
                },
              ],
            },
          ],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin(),
      new webpack.ProvidePlugin({
        identifier1: 'module1',
        identifier2: ['module2', 'property'],
        identifier3: path.resolve(path.join(__dirname, 'src/module1')),
        Buffer: ['buffer', 'Buffer'],
        _map: ['lodash', 'map'],
        'window.jQuery': 'jquery',
        Vue: ['vue/dist/vue.esm.js', 'default'],
      }),
    ],
    resolveLoader: {
      alias: {
        'my-loader': path.resolve(__dirname, 'src/my-custom-loader.js'),
      },
    },
    optimization: {
      minimizer: [new HtmlMinimizerPlugin({ parallel: true })],
    },
  };
};

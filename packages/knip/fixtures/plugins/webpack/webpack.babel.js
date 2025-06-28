/** @type {import("webpack").Configuration} */
module.exports = {
  mode: 'none',
  entry: {
    eslint: ['core-js/stable', 'regenerator-runtime/runtime', './lib/linter/linter.js'],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/u,
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', {}]],
        },
      },
    ],
  },
  resolve: {
    mainFields: ['browser', 'main', 'module'],
  },
};

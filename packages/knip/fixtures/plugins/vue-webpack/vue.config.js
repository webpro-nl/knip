const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
          @use 'sass:math';
          @import "@/styles/config.scss";
        `,
      },
    },
    extract: {
      ignoreOrder: true,
    },
  },
  configureWebpack: config => {
    config.resolve.fallback = {
      fs: false,
    };

    config.plugins.push(new CircularDependencyPlugin({}));

    config.module.rules.push({
      test: /\.md?$/,
      use: ['babel-loader', 'raw-loader'],
    });

    config.module.rules.push({
      test: /\.gql$/,
      use: 'graphql-tag/loader',
    });

    config.resolve.symlinks = false;

    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env.APP_VERSION': JSON.stringify(require('./package.json').version),
      })
    );
  },
  chainWebpack: config => {
    config.resolve.symlinks(false);
    config.resolve.alias.set('vue', '@vue/compat');
  },
  devServer: {
    port: 3000,
    client: {
      logging: 'info',
      progress: false,
    },
  },
});

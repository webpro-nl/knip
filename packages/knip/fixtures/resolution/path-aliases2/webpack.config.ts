import path from 'node:path';

export default {
  entry: './entry.ts',
  resolve: {
    alias: {
      '#*': path.resolve(__dirname, 'webpack/*'),
      'webpack-components': path.resolve(__dirname, 'webpack', 'components'),
      'webpack-shared': path.resolve(__dirname, 'webpack', 'shared'),
      'webpack-exact$': path.resolve(__dirname, 'webpack', 'match.ts'),
      handlebars: false,
      filenamify: 'filenamify/browser',
      lodash: 'lodash-es',
      jquery: 'jquery/dist/jquery.slim.min.js',
    },
  },
};

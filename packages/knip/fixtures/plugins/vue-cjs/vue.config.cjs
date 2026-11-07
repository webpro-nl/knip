const { alias } = require('./aliases.cjs');

module.exports = {
  configureWebpack: {
    resolve: { alias },
    module: {
      rules: [{ test: /\.txt$/, use: 'raw-loader' }],
    },
  },
};

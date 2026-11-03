const { alias } = require('./aliases.cjs');

module.exports = {
  configureWebpack: {
    resolve: { alias },
  },
};

const { babelCompatSupport } = require('@embroider/compat/babel');

module.exports = {
  plugins: ['@babel/plugin-transform-class-properties', 'macros', ...babelCompatSupport()],
};

const mySharedConfig = require('glob');

module.exports = {
  ...mySharedConfig,
  rules: {
    'func-names': 'off',
  },
};
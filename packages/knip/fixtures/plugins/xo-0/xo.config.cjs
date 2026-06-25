const mySharedConfig = require('my-shared-config');

module.exports = {
  ...mySharedConfig,
  rules: {
    'func-names': 'off',
  },
};

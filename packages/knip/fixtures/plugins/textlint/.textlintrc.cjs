const path = require('node:path');

module.exports = {
  rules: {
    [require.resolve('./rules/check-document.cjs')]: true,
    [path.join(__dirname, 'rules/check-heading')]: true,
    [path.join(__dirname, 'rules/check-link')]: true,
  },
};

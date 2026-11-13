'use strict';

module.exports = {
  plugins: ['ember-template-lint-plugin-prettier', './lib/no-fruit.js'],
  extends: ['recommended', 'prettier:recommended'],
};

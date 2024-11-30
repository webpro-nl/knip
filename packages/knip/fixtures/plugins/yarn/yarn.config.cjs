// https://yarnpkg.com/features/constraints

/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types');

module.exports = defineConfig({
  async constraints({Yarn}) {
    // `Yarn` is now well-typed ✨
  },
});

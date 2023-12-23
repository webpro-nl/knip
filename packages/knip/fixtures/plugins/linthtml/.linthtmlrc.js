/** @typedef {import('@linthtml/linthtml').LinterConfig} LinterConfig */

/** @type {LinterConfig} */
const config = {
  extends: '@linthtml/linthtml-config-recommended',
  rules: {
    'attr-quote-style': [true, 'double'],
    'title-max-len': [true, 60],
  },
};

module.exports = config;

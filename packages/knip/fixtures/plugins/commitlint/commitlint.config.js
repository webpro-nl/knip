module.exports = {
  extends: ['lerna', '@commitlint/config-conventional', '@organization', './commitlint.base'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/u,
    },
  },
  formatter: '@commitlint/format',
  plugins: [
    {
      rules: {
        'contains-issue': () => {},
        'dollar-sign': () => {},
      },
    },
    'commitlint-plugin-tense',
    '@organization/scope',
  ],
  rules: {
    'type-enum': [2, 'always', ['oh-no']],
  },
};

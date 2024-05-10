module.exports = {
  extends: ['lerna', '@commitlint/config-conventional'],
  parserPreset: 'conventional-changelog-atom',
  formatter: '@commitlint/format',
  plugins: [
    {
      rules: {
        'contains-issue': () => {},
        'dollar-sign': () => {},
      },
    },
    'commitlint-plugin-tense',
  ],
  rules: {
    'type-enum': [2, 'always', ['oh-no']],
  },
};

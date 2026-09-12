module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: 'espree',
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: require('@typescript-eslint/parser'),
      },
    },
  ],
};

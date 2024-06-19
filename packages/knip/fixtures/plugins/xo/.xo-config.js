module.exports = {
  space: true,
  prettier: true,
  plugins: ['unused-imports'],
  parserOptions: {emitDecoratorMetadata: true},
  rules: {
    'func-names': ['error', 'always'],
  },
};

import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    space: true,
    prettier: true,
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: { emitDecoratorMetadata: true },
    },
    rules: {
      'func-names': ['error', 'always'],
    },
  },
];

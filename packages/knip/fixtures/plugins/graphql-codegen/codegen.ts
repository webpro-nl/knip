module.exports = {
  schema: 'schema.graphql',
  overwrite: true,
  generates: {
    './graphql.schema.json': {
      plugins: ['introspection', 'graphql-codegen-typescript-validation-schema'],
    },
    './graphql.schema.graphql': {
      'schema-ast': {},
    },
    './src/generated/graphql.ts': {
      documents: ['./src/**/*.tsx'],
      preset: '@graphql-codegen/graphql-modules-preset',
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
    },
    './lib/': {
      documents: ['./lib/**/*.tsx'],
      preset: 'near-operation-file-preset',
      plugins: ['typescript-operations', 'typescript-msw'],
    },
  },
};

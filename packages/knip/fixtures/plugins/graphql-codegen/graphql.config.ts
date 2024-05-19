const config = {
  schema: 'schema.graphql',
  extensions: {
    codegen: {
      overwrite: true,
      generates: {
        './graphql.schema.graphql': {
          'schema-ast': {},
        },
        './lib/': {
          documents: ['./lib/**/*.tsx'],
          preset: 'near-operation-file-preset',
          plugins: ['typescript-operations', 'typescript-msw'],
        },
      },
    },
  },
};

export default config;

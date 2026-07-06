export default {
  schema: 'schema.graphql',
  documents: 'src/**/*.ts',
  generates: {
    './src/gql/': {
      preset: 'client',
    },
  },
};

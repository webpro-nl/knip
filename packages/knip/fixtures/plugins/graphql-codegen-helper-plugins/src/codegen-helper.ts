export const getCodegenConfig = () => ({
  schema: 'schema.graphql',
  generates: {
    './src/generated/graphql.ts': {
      documents: ['./src/**/*.graphql'],
      plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
    },
  },
});

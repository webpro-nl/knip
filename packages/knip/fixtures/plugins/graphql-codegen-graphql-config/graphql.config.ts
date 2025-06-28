import type { IGraphQLConfig } from 'graphql-config';

const config: IGraphQLConfig = {
  schema: 'schema.graphql',
  extensions: {
    codegen: {
      overwrite: true,
      generates: {
        './graphql.schema.json': {
          plugins: ['introspection'],
        },
        './graphql.schema.graphql': {
          'schema-ast': {},
        },
        './src/generated/graphql.ts': {
          documents: ['./src/**/*.tsx'],
          plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
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

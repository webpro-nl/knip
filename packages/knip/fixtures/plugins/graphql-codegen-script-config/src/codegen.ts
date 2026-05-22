import { getClientPlugins } from './codegen-helpers.ts';

const config = {
  schema: './src/schema.graphql',
  documents: './src/operations.graphql',
  generates: {
    './src/generated/graphql.ts': {
      plugins: getClientPlugins(),
    },
  },
};

export default config;

import { readFileSync } from 'node:fs';

const plugins = JSON.parse(readFileSync('./config/codegen-plugins.json', 'utf8'));

const config = {
  schema: './src/schema.graphql',
  documents: './src/operations.graphql',
  generates: {
    './src/generated/graphql.ts': {
      plugins,
    },
  },
};

export default config;

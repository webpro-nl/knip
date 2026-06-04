export default {
  entry: ['index.ts'],
  project: [
    '**/*.{ts,template}',
    '**/*.sql',
    '**/*.@(graphql|gql)',
    '**/*.(toml|yaml)',
  ],
};

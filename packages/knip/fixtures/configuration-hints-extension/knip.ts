export default {
  entry: ['index.ts'],
  project: [
    '**/*.{ts,astro,tpl,template}',
    '**/*.sql',
    '**/*.@(graphql|gql)',
    '**/*.(toml|yaml)',
  ],
  compilers: {
    tpl: () => '',
    svg: () => '',
  },
};

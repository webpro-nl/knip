export default {
  schema: 'schema.graphql',
  generates: {
    './src/': {
      documents: 'src/**/*.ts',
      preset: 'near-operation-file',
      presetConfig: {
        baseTypesPath: 'types.ts',
        folder: '__generated__',
      },
      plugins: ['typescript-operations'],
    },
  },
};

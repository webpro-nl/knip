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
    './features/': {
      documents: 'features/**/*.ts',
      preset: 'near-operation-file',
      presetConfig: {
        baseTypesPath: 'types.ts',
        folder: '../__generated__',
      },
      plugins: ['typescript-operations'],
    },
    './operations/': {
      documents: 'operations/**/*.ts',
      preset: 'near-operation-file',
      presetConfig: {
        baseTypesPath: 'types.ts',
        fileName: 'types',
        filePerOperation: true,
      },
      plugins: ['typescript-operations'],
    },
  },
};

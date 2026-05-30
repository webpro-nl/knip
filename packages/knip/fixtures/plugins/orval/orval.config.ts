import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    output: {
      target: 'src/petstore.ts',
      override: {
        mutator: {
          path: './src/custom-instance.ts',
          name: 'customInstance',
        },
      },
    },
    input: {
      target: './petstore.yaml',
      override: {
        transformer: './src/transformer.ts',
      },
    },
  },
});

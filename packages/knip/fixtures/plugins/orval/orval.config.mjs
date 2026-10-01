import { defineConfig } from 'orval';

export default defineConfig({
  petstore: {
    output: 'src/petstore.ts',
    input: './petstore.yaml',
  },
});

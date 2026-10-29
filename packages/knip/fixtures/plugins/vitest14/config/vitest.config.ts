import { resolve } from 'node:path';

export default {
  build: {
    lib: {
      entry: {
        library: 'src/library.ts',
        absolute: resolve(import.meta.dirname, '../src/absolute.ts'),
      },
    },
  },
};

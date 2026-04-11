import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'tests');

export default defineConfig({
  test: {
    root,
    include: ['*.test.ts'],
    setupFiles: ['./setup.ts'],
  },
});

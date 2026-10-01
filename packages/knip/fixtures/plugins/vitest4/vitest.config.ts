import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: 'tests',
    include: ['*.test.ts'],
    reporters: ['default', './custom-reporter.js', ['custom-reporter-package', {}]],
    setupFiles: ['./setup.ts'],
  },
});

import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['<rootDir>/login.check.ts'],
  resolve: {
    alias: {
      '@assets': './theme',
    },
  },
});

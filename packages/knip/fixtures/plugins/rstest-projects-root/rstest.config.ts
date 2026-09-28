import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: 'runner',
  projects: ['packages/*'],
});

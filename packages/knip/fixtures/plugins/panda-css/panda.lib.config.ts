import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  presets: ['@shadow-panda/preset'],
  include: ['./src/components/**/*.tsx'],
  outdir: 'dist/styled-system',
});

import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  presets: ['@pandacss/preset-panda', '@park-ui/panda-preset'],
  include: ['./src/**/*.tsx'],
});

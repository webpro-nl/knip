import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-json';

export default defineConfig({
  locales: ['en', 'nl'],
  format: formatter(),
});

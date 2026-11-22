import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';
import extractor from './extractor.ts';

export default defineConfig({
  locales: ['en', 'nl'],
  catalogs: [{ path: 'locales/{locale}', include: ['src'] }],
  format: formatter(),
  extractors: [extractor],
});

import { defineConfig } from 'vitest/config';

class ReporterClass { };

export default defineConfig({
  test: {
    reporters: [
      'ReporterString',
      ['ReporterArray', { options: {} }],
      ReporterClass
    ]
  },
});

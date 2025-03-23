import { defineConfig } from 'vitest/config';

class ReporterClass { };

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          name: 'integration',
          setupFiles: './vitest.integration.setup.mjs',
        },
      },
      {
        test: {
          globalSetup: './vitest.unit.setup.ts',
          name: 'unit',
        },
      },
    ],
  },
});

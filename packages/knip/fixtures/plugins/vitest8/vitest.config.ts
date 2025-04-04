import { defineConfig } from 'vitest/config';

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

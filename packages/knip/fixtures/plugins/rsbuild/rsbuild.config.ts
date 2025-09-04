import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      entry1: 'entry-1.ts',
      entry2: ['entry-2.ts'],
      entry3: { import: 'entry-3.ts' },
      entry4: { import: ['entry-4.ts'] },
    },
  },
  environments: {
    test: {
      source: {
        entry: {
          entry5: 'entry-5.ts',
          entry6: ['entry-6.ts'],
          entry7: { import: 'entry-7.ts' },
          entry8: { import: ['entry-8.ts'] },
        },
      },
    },
  },
});

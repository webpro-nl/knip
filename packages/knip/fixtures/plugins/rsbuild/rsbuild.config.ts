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
});

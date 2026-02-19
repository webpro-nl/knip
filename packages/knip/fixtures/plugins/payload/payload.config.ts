import type { Config } from 'payload';

export default {
  admin: {
    importMap: {
      importMapFile: 'src/app/(payload)/importMap.js',
    },
  },
} satisfies Config;

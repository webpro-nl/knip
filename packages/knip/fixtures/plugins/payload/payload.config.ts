import type { Config } from 'payload';

const buildConfig = async (config: Config) => config;

export default buildConfig({
  admin: {
    importMap: {
      importMapFile: 'src/app/(payload)/importMap.js',
    },
  },
});

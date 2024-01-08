import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    './src/index',
    {
      builder: 'mkdist',
      input: './src/package/components/',
      outDir: './build/components',
    },
  ],
});

import formatjs from '@formatjs/unplugin/rsbuild';
import { defineConfig } from '@rstest/core';

export default defineConfig({
  plugins: [formatjs()],
});

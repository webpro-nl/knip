import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: { entry: { index: './src/app.ts' } },
  tools: {
    swc: {
      jsc: {
        experimental: {
          plugins: [['@swc/plugin-emotion', {}], ['@swc/plugin-styled-components', {}]],
        },
      },
    },
  },
  environments: {
    node: {
      tools: {
        swc: { jsc: { experimental: { plugins: [['swc-plugin-component-annotate', {}]] } } },
      },
    },
  },
});

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [`entry-2.ts`],
  deps: {
    neverBundle: ['wasm-sandbox', /^@native\//],
  },
});

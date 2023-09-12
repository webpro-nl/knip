import type { VitestConfig } from '../vitest/types.js';

export interface ViteConfig extends VitestConfig {
  plugins: unknown[];
}

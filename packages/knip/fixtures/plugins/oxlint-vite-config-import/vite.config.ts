import { defineConfig } from 'vite-plus';
import { lint } from './tooling/lint.js';

export default defineConfig({
  lint,
});

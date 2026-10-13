import solid from '@solidjs/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  plugins: [solid({ start: true, ssr: true })],
});

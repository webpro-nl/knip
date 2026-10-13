import solid from '@solidjs/vite-plugin';
import { defineConfig } from 'vite';

const clientOnly = process.env.CLIENT_ONLY ? { ssr: false } : {};

export default defineConfig({
  plugins: [solid({ start: true, ssr: true, ...clientOnly })],
});

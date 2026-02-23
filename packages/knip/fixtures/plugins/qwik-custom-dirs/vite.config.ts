import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [qwikCity({ routesDir: ['docs/pages', 'docs/extra-pages'] }), qwikVite({ srcDir: 'docs' })],
}));

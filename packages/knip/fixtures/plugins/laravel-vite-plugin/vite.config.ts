import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/css/cellar.css', 'resources/js/press.js'],
      ssr: 'resources/js/ssr.js',
      refresh: true,
    }),
  ],
});

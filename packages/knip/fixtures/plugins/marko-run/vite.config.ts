import marko from '@marko/run/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [marko({ routesDir: 'src/app-routes' })],
});

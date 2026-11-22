import { withPwa } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [withPwa({ files: { lib: 'lib' } })],
});

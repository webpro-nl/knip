import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: '[variant]/worker.ts' })],
};

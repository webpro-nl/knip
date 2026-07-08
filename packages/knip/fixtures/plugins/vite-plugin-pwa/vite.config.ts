import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts' })],
};

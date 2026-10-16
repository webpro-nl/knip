import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  makers: [
    new MakerSquirrel({}),
    { name: '@electron-forge/maker-zip', platforms: ['darwin'], config: {} },
    { name: '@electron-forge/maker-deb', config: {} },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: { repository: { owner: 'acme', name: 'notes' } },
    },
  ],
  plugins: [
    { name: '@electron-forge/plugin-auto-unpack-natives', config: {} },
    new VitePlugin({
      build: [
        { entry: 'src/app/window.ts', config: 'vite.main.config.ts', target: 'main' },
        { entry: 'src/app/bridge.ts', config: 'vite.preload.config.ts', target: 'preload' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.ts' }],
    }),
  ],
};

export default config;

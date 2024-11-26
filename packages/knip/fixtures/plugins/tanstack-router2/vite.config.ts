import { defineConfig, type PluginOption } from 'vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [TanStackRouterVite() as unknown as PluginOption],
});

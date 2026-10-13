import solidPlugin from '@solidjs/vite-plugin';
import { defineConfig } from 'vite';

const solid = solidPlugin;

const timing = (options: { start: { label: string } }) => ({ name: 'timing', options });

export default defineConfig({
  plugins: [solid(), timing({ start: { label: 'boot' } })],
});

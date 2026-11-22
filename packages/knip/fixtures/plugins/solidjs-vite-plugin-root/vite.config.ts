import solid from '@solidjs/vite-plugin';
import type { UserConfig } from 'vite';

export default {
  root: 'app',
  plugins: [solid({ start: true })],
} satisfies UserConfig;

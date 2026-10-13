import solid from '@solidjs/vite-plugin';

export default {
  plugins: [solid({ start: { setup: './src/setup.ts' } })],
};

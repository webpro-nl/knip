import solid from '@solidjs/vite-plugin';

export default {
  plugins: [solid({ ssr: true, start: { setup: './src/setup.ts' } })],
};

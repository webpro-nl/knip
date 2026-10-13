import solid from '@solidjs/vite-plugin';

export default {
  root: 'app',
  plugins: [solid({ start: true, ssr: true })],
};

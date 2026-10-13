import solid from '@solidjs/vite-plugin';

const clientOnly = process.env.CLIENT_ONLY ? { ssr: false } : {};

export default {
  plugins: [solid({ start: true, ssr: true, ...clientOnly })],
};

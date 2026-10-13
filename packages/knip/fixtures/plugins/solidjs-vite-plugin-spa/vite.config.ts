import solidPlugin from '@solidjs/vite-plugin';

const solid = solidPlugin;

const timing = (options: { start: { label: string } }) => ({ name: 'timing', options });

export default {
  plugins: [solid(), timing({ start: { label: 'boot' } })],
};

import { solid, timing } from './plugins.ts';

export default {
  plugins: [solid(), timing({ start: { label: 'boot' } })],
};

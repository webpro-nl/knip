import { esbuildPlugin } from '@web/dev-server-esbuild';
import options from './runner-options.js';

export default {
  ...options,
  plugins: [esbuildPlugin({ js: true })],
};

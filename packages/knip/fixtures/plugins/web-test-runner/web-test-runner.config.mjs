import { esbuildPlugin } from '@web/dev-server-esbuild';
import options from './runner-options.js';

const assets = { name: 'assets', files: ['spec/decorated/only.js'] };

const config = {
  ...options,
  files: ['spec/listed.js', '!spec/skipped.js'],
  groups: [{ name: 'integration', files: ['spec/integration-only.js'] }],
  plugins: [esbuildPlugin({ js: true }), assets],
};

export default config;

import type { IsPluginEnabled } from '#p/types/plugins.js';

// https://nodejs.dev/en/api/test/

const title = 'Node.js Test Runner';

const enablers = 'This plugin is enabled when any script in `package.json` includes `node --test`';

// TODO Better to scan the entry files until the first `node:test` import, but that's expensive
const isEnabled: IsPluginEnabled = ({ manifest }) =>
  Object.keys(manifest.scripts ?? {}).some(
    script => manifest.scripts && /(?<=^|\s)node (.*)--test/.test(manifest.scripts[script])
  );

const entry = ['**/*{.,-,_}test.?(c|m)js', '**/test-*.?(c|m)js', '**/test.?(c|m)js', '**/test/**/*.?(c|m)js'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
};

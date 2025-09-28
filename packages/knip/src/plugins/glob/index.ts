import type { Plugin } from '../../types/config.js';

// https://github.com/isaacs/node-glob

const title = 'glob';

const args = {
  positional: true,
  alias: { cmd: ['c'] },
  fromArgs: ['cmd'],
};

export default {
  title,
  args,
} satisfies Plugin;

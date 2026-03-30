import type { Plugin } from '../../types/config.ts';

// https://github.com/isaacs/node-glob

const title = 'glob';

const args = {
  positional: true,
  alias: { cmd: ['c'] },
  fromArgs: ['cmd'],
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

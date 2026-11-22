import type { Plugin } from '../../types/config.ts';

// https://github.com/antfu-collective/vite-node/blob/v6.0.0/src/cli.ts

const title = 'vite-node';

const args = {
  positional: true,
  boolean: ['inspect', 'script'],
  alias: { watch: ['w'] },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

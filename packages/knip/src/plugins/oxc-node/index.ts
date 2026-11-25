import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';
import { args as nodeArgs } from '../node/index.ts';

// https://oxc.rs/docs/guide/usage/oxc-node.html

const title = 'oxc-node';

const args = {
  ...nodeArgs,
  binaries: ['oxnode'],
  string: [...nodeArgs.string, 'exclude', 'include', 'tsconfig'],
  args: (args: string[]) => (args[0] === 'watch' ? args.slice(1) : args),
} satisfies Args;

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

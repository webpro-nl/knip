import type { Plugin } from '../../types/config.js';

// https://tsx.is

const title = 'tsx';

const args = {
  positional: true,
  nodeImportArgs: true,
  args: (args: string[]) => args.filter(arg => arg !== 'watch'),
};

export default {
  title,
  args,
} satisfies Plugin;

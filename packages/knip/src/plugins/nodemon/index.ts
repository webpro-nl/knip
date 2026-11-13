import type { Plugin } from '../../types/config.ts';

const title = 'nodemon';

const args = {
  positional: false,
  nodeImportArgs: true,
  string: ['exec'],
  alias: { exec: ['x'] },
  fromArgs: ['exec'],
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

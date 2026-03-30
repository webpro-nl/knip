import type { Plugin } from '../../types/config.ts';

const title = 'nodemon';

const args = {
  positional: false,
  nodeImportArgs: true,
  string: ['exec'],
  fromArgs: ['exec'],
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

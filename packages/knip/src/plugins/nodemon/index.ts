import type { Plugin } from '../../types/config.ts';

const title = 'nodemon';

const args = {
  positional: false,
  nodeImportArgs: true,
  alias: { exec: ['x'] },
  fromArgs: ['exec'],
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

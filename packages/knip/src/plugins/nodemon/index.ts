import type { Plugin } from '../../types/config.js';

const title = 'nodemon';

const args = {
  positional: false,
  nodeImportArgs: true,
  string: ['exec'],
  fromArgs: ['exec'],
};

export default {
  title,
  args,
} satisfies Plugin;

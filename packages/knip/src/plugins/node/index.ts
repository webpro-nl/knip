import type { Plugin } from '../../types/config.js';

const title = 'Node.js';

const args = {
  positional: true,
  nodeImportArgs: true,
};

export default {
  title,
  args,
} satisfies Plugin;

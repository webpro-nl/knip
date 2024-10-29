import type { Plugin } from '../../types/config.js';

// https://typestrong.org/ts-node/docs/options

const title = 'ts-node';

const args = {
  binaries: [title],
  positional: true,
  nodeImportArgs: true,
  boolean: ['transpileOnly', 'compilerHost', 'ignoreDiagnostics', 'swc', 'preferTsExts'],
  alias: { transpileOnly: ['T'], compilerHost: ['H'], ignoreDiagnostics: ['D'] },
};

export default {
  title,
  args,
} satisfies Plugin;

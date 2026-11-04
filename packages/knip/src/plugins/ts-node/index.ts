import type { Plugin } from '../../types/config.ts';

// https://typestrong.org/ts-node/docs/options

const title = 'ts-node';

const args = {
  positional: true,
  nodeImportArgs: true,
  boolean: ['transpileOnly', 'compilerHost', 'ignoreDiagnostics', 'swc', 'preferTsExts'],
  alias: {
    transpileOnly: ['T', 'transpile-only'],
    compilerHost: ['H', 'compiler-host'],
    ignoreDiagnostics: ['D'],
    preferTsExts: ['prefer-ts-exts'],
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

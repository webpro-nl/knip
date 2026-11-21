import type { Plugin } from '../../types/config.ts';

// https://github.com/wclr/ts-node-dev/blob/v2.0.0/src/bin.ts

const title = 'ts-node-dev';

const args = {
  binaries: ['ts-node-dev', 'tsnd'],
  positional: true,
  nodeImportArgs: true,
  args: (args: string[]) => args.filter((arg, index) => arg !== '--watch' && args[index - 1] !== '--watch'),
  boolean: [
    'all-deps',
    'clear',
    'cls',
    'compiler-host',
    'debug',
    'dedupe',
    'deps',
    'emit',
    'error-recompile',
    'exec-check',
    'exit-child',
    'files',
    'fork',
    'log-error',
    'notify',
    'poll',
    'prefer-ts-exts',
    'pretty',
    'respawn',
    'rs',
    'scope',
    'script-mode',
    'skip-ignore',
    'skip-project',
    'transpile-only',
    'tree-kill',
  ],
  alias: {
    'compiler-host': ['H'],
    'prefer-ts-exts': ['prefer-ts'],
    'script-mode': ['s'],
    'transpile-only': ['T'],
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

import type { Plugin } from '../../types/config.ts';

// https://typestrong.org/ts-node/docs/options

const title = 'ts-node';

const args = {
  binaries: ['ts-node', 'ts-node-cwd', 'ts-node-esm', 'ts-node-script', 'ts-node-transpile-only'],
  positional: true,
  nodeImportArgs: true,
  string: ['ignoreDiagnostics'],
  boolean: [
    'compilerHost',
    'cwdMode',
    'emit',
    'esm',
    'files',
    'interactive',
    'logError',
    'preferTsExts',
    'pretty',
    'print',
    'scope',
    'scriptMode',
    'showConfig',
    'skipIgnore',
    'skipProject',
    'swc',
    'transpileOnly',
    'typeCheck',
  ],
  alias: {
    transpileOnly: ['T', 'transpile-only'],
    compilerHost: ['H', 'compiler-host'],
    ignoreDiagnostics: ['D', 'ignore-diagnostics'],
    preferTsExts: ['prefer-ts-exts'],
    cwdMode: ['cwd-mode'],
    interactive: ['i'],
    logError: ['log-error'],
    print: ['p'],
    scriptMode: ['s', 'script-mode'],
    showConfig: ['show-config'],
    skipIgnore: ['skip-ignore'],
    skipProject: ['skip-project'],
    typeCheck: ['type-check'],
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

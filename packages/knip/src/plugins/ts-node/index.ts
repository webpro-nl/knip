import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';

// https://typestrong.org/ts-node/docs/options

const title = 'ts-node';

const args = {
  binaries: ['ts-node', 'ts-node-cwd', 'ts-node-esm', 'ts-node-script', 'ts-node-transpile-only'],
  positional: (parsed: ParsedArgs) => (parsed.eval === undefined ? parsed._.slice(0, 1) : []),
  nodeImportArgs: true,
  string: [
    'compiler',
    'compilerOptions',
    'cwd',
    'dir',
    'eval',
    'experimentalSpecifierResolution',
    'ignore',
    'ignoreDiagnostics',
    'project',
    'scopeDir',
    'transpiler',
  ],
  alias: {
    compiler: ['C'],
    compilerOptions: ['O', 'compiler-options'],
    eval: ['e'],
    ignore: ['I'],
    ignoreDiagnostics: ['D', 'ignore-diagnostics'],
    project: ['P'],
  },
  boolean: true,
  stopEarly: true,
} satisfies Args;

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

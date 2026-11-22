import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/c8

const title = 'c8';

const commands = new Set(['check-coverage', 'report']);

const args: Args = {
  boolean: [
    '100',
    'all',
    'allowExternal',
    'check-coverage',
    'clean',
    'exclude-after-remap',
    'exclude-node-modules',
    'experimental-monocart',
    'merge-async',
    'omit-relative',
    'per-file',
    'skip-full',
  ],
  fromArgs: (parsed, args) => (commands.has(parsed._[0]) ? [] : spawningArgs(parsed, args)),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

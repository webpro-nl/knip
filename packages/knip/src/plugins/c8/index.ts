import { spawningArgs } from '../../binaries/util.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/c8

const title = 'c8';

const args = {
  args: (args: string[]) => args.filter(arg => arg !== 'check-coverage'),
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
  fromArgs: spawningArgs,
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

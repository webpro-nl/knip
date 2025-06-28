import type { ParsedArgs } from 'minimist';
import { argsFrom } from '../../binaries/util.js';
import type { Plugin } from '../../types/config.js';

// https://www.npmjs.com/package/c8

const title = 'c8';

const args = {
  args: (args: string[]) => args.filter(arg => arg !== 'check-coverage'),
  boolean: ['all', 'check-coverage', 'clean', 'exclude-after-remap', 'per-file', 'skip-full'],
  fromArgs: (parsed: ParsedArgs, args: string[]) => argsFrom(args, parsed._[0]),
};

export default {
  title,
  args,
} satisfies Plugin;

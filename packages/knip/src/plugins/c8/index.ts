import type { ParsedArgs } from 'minimist';
import { argsFrom } from '../../binaries/util.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmjs.com/package/c8

const title = 'c8';

const args = {
  args: (args: string[]) => args.filter(arg => arg !== 'check-coverage'),
  boolean: ['all', 'check-coverage', 'clean', 'exclude-after-remap', 'per-file', 'skip-full'],
  fromArgs: (parsed: ParsedArgs, args: string[]) => (parsed._[0] ? argsFrom(args, parsed._[0]) : (parsed['--'] ?? [])),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

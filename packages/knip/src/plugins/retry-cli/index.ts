import type { ParsedArgs } from '../../util/parse-args.ts';
import { argsFrom } from '../../binaries/util.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/retry-cli

const title = 'retry-cli';

const args = {
  string: ['factor', 'max-timeout', 'min-timeout', 'retries'],
  boolean: ['help', 'randomize'],
  alias: { factor: ['f'], help: ['h'], 'min-timeout': ['t'], retries: ['n'] },
  fromArgs: (parsed: ParsedArgs, args: string[]) => (parsed._[0] ? argsFrom(args, parsed._[0]) : (parsed['--'] ?? [])),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

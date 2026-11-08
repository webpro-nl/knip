import { spawningArgs } from '../../binaries/util.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/retry-cli

const title = 'retry-cli';

const args = {
  binaries: ['retry', 'retry-cli'],
  string: ['factor', 'max-timeout', 'min-timeout', 'retries'],
  boolean: ['help', 'randomize'],
  alias: { factor: ['f'], help: ['h'], 'min-timeout': ['t'], retries: ['n'] },
  fromArgs: spawningArgs,
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

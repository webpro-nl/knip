import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/start-server-and-test
// https://github.com/bahmutov/start-server-and-test/blob/v3.0.13/src/utils.js#L89-L178

const title = 'start-server-and-test';

const args: Args = {
  binaries: ['server-test', 'start-server-and-test', 'start-test'],
  fromArgs: parsed =>
    [...parsed._, ...(parsed['--'] ?? [])].filter(arg => typeof arg === 'string' && arg.includes(' ')).join('\n'),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/start-server-and-test
// https://github.com/bahmutov/start-server-and-test/blob/v3.0.13/src/utils.js#L89-L178

const title = 'start-server-and-test';

const args: Args = {
  binaries: ['server-test', 'start-server-and-test', 'start-test'],
  string: ['expect'],
  fromArgs: parsed => {
    const commands: string[] = [];
    for (const arg of parsed._) {
      if (typeof arg !== 'string' || !arg.includes(' ')) continue;
      if (commands.length > 0) commands.push('&&');
      commands.push(...arg.split(' '));
    }
    return commands;
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

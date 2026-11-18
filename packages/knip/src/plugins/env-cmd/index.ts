import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/env-cmd
// https://github.com/toddbluhm/env-cmd/blob/10.1.0/src/parse-args.ts#L60-L75
// https://github.com/toddbluhm/env-cmd/blob/11.0.0/src/parse-args.ts#L95-L117

const title = 'env-cmd';

const valueOptions = new Set(['-f', '--file', '-r', '--rc-file']);

const args: Args = {
  boolean: ['expand-envs', 'fallback', 'recursive', 'silent', 'use-shell', 'verbose'],
  alias: { environments: ['e'], file: ['f'], 'rc-file': ['r'], 'expand-envs': ['x'] },
  args: argv => {
    const rest = [];
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--' || !arg.startsWith('-')) return [...rest, ...argv.slice(i)];
      if (arg === '-e' || arg === '--environments') {
        while (i + 1 < argv.length && !argv[i + 1].startsWith('-')) i++;
      } else if (!arg.startsWith('-e')) {
        rest.push(arg);
        if (valueOptions.has(arg) && i + 1 < argv.length) rest.push(argv[++i]);
      }
    }
    return rest;
  },
  fromArgs: (parsed, argv) => {
    const command = spawningArgs(parsed, argv);
    return parsed['use-shell'] ? command.join(' ') : command;
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

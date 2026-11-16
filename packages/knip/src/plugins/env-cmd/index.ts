import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';

// https://www.npmx.dev/package/env-cmd
// https://github.com/toddbluhm/env-cmd/blob/10.1.0/src/parse-args.ts#L60-L75
// https://github.com/toddbluhm/env-cmd/blob/11.0.0/src/parse-args.ts#L95-L117

const title = 'env-cmd';

const environmentFlags = new Set(['-e', '--environments']);

const valueFlags = new Set(['-f', '--file', '-r', '--rc-file']);

const booleanFlags = new Set([
  '-x',
  '--expand-envs',
  '--fallback',
  '--no-override',
  '--recursive',
  '--silent',
  '--use-shell',
  '--verbose',
]);

const isFlag = (arg: string) => {
  const index = arg.indexOf('=');
  const name = index === -1 ? arg : arg.slice(0, index);
  return environmentFlags.has(name) || valueFlags.has(name) || booleanFlags.has(name);
};

const getCommandIndex = (args: string[]) => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') return i + 1;
    if (environmentFlags.has(arg)) while (i + 1 < args.length && !args[i + 1].startsWith('-')) i++;
    else if (valueFlags.has(arg)) i++;
    else if (!isFlag(arg)) return arg.startsWith('-') ? -1 : i;
  }
  return -1;
};

const getCommand = (parsed: ParsedArgs, args: string[]) => {
  const index = getCommandIndex(args);
  return index === -1 || index === args.length || args[index].startsWith('-')
    ? spawningArgs(parsed, args)
    : args.slice(index);
};

const args: Args = {
  boolean: ['expand-envs', 'fallback', 'recursive', 'silent', 'use-shell'],
  alias: { 'expand-envs': ['x'] },
  fromArgs: (parsed, args) => {
    const command = getCommand(parsed, args);
    return parsed['use-shell'] ? command.flatMap(arg => arg.split(' ')) : command;
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

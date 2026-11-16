import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';

// https://www.npmx.dev/package/env-cmd
// https://github.com/toddbluhm/env-cmd/blob/10.1.0/src/parse-args.ts#L60-L75
// https://github.com/toddbluhm/env-cmd/blob/11.0.0/src/parse-args.ts#L95-L117

const title = 'env-cmd';

const environmentFlags = new Set(['-e', '--environments']);

const isEnvironmentName = (args: string[], index: number) => {
  for (let i = index - 1; i >= 0; i--) if (args[i].startsWith('-')) return environmentFlags.has(args[i]);
  return false;
};

const getCommand = (parsed: ParsedArgs, args: string[]) =>
  parsed['--']?.length && isEnvironmentName(args, args.indexOf(parsed._[0]))
    ? parsed['--']
    : spawningArgs(parsed, args);

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

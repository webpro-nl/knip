import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://pubs.opengroup.org/onlinepubs/9799919799/utilities/env.html
// https://www.gnu.org/software/coreutils/manual/html_node/env-invocation.html

const title = 'env';

const isAssignmentOrSubstitution = (arg: string) => /^(\w+=|\$\()/.test(arg);

const args: Args = {
  boolean: ['ignore-environment'],
  string: ['chdir'],
  alias: { chdir: ['C'], 'ignore-environment': ['i'] },
  fromArgs: (parsed, args) => {
    if (parsed.chdir) return [];
    const command = spawningArgs(parsed, args);
    const index = command.findIndex(arg => !isAssignmentOrSubstitution(arg));
    if (index === -1) return [];
    const nodeOptions = command.slice(0, index).filter(arg => arg.startsWith('NODE_OPTIONS='));
    return [...nodeOptions, ...command.slice(index)];
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

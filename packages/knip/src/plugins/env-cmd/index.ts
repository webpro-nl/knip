import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/env-cmd
// https://github.com/toddbluhm/env-cmd/blob/10.1.0/src/parse-args.ts#L60-L75
// https://github.com/toddbluhm/env-cmd/blob/11.0.0/src/parse-args.ts#L95-L117

const title = 'env-cmd';

const args: Args = {
  boolean: true,
  string: ['environments', 'file', 'rc-file'],
  alias: { environments: ['e'], file: ['f'], 'rc-file': ['r'] },
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

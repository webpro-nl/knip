import { spawningArgs } from '../../binaries/util.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/dotenv

const title = 'dotenv';

const args = {
  binaries: ['dotenv', 'dotenv-cli'],
  args: (args: string[]) => (args[0] === 'run' ? args.slice(1) : args),
  boolean: ['debug', 'fast', 'override'],
  alias: { quiet: ['q'] },
  fromArgs: spawningArgs,
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

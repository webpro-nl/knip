import type { ParsedArgs } from 'minimist';
import { argsFrom } from '../../binaries/util.js';
import type { Plugin } from '../../types/config.js';

// https://www.npmjs.com/package/dotenv

const title = 'dotenv';

const args = {
  fromArgs: (parsed: ParsedArgs, args: string[]) => argsFrom(args, parsed._[0]),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

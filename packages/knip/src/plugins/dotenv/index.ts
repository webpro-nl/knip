import type { ParsedArgs } from 'minimist';
import { argsFrom } from '../../binaries/util.js';
import type { Plugin } from '../../types/config.js';

// https://www.npmjs.com/package/dotenv

const title = 'dotenv';

const args = {
  fromArgs: (parsed: ParsedArgs, args: string[]) => {
    if (parsed._[0]) return argsFrom(args, parsed._[0]);
    if (!parsed['--'] || parsed['--'].length === 0) return [];
    const script = parsed['--'].map(arg => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ');
    return [script];
  },
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

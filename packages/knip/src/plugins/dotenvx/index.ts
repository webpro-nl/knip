import type { ParsedArgs } from 'minimist';
import { argsFrom } from '../../binaries/util.js';
import type { Plugin } from '../../types/config.js';

// https://dotenvx.com/

const title = 'dotenvx';

const args = {
  fromArgs: (parsed: ParsedArgs) => (parsed._[0] === 'run' ? parsed._.slice(1) : []),
}

export default {
  title,
  args,
} satisfies Plugin;

import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';
import { toEntryPath } from '../../util/input.ts';

// https://github.com/antfu-collective/vite-node/blob/v6.0.0/src/cli.ts

const title = 'vite-node';

const args: Args = {
  boolean: ['inspect', 'script'],
  alias: { watch: ['w'] },
  resolveInputs: parsed => (parsed._[0] ? [toEntryPath(parsed._[0])] : []),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

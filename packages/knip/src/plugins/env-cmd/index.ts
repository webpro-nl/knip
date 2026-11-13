import { spawningArgs } from '../../binaries/util.ts';
import type { Args } from '../../types/args.ts';
import type { Plugin } from '../../types/config.ts';

// https://www.npmx.dev/package/env-cmd
// https://github.com/toddbluhm/env-cmd/blob/10.1.0/src/parse-args.ts#L60-L75
// https://github.com/toddbluhm/env-cmd/blob/11.0.0/src/parse-args.ts#L95-L117

const title = 'env-cmd';

const args: Args = {
  boolean: ['expand-envs', 'fallback', 'recursive', 'silent', 'use-shell'],
  alias: { 'expand-envs': ['x'] },
  fromArgs: (parsed, args) => (parsed['--']?.length ? parsed['--'] : spawningArgs(parsed, args)),
};

const plugin: Plugin = {
  title,
  args,
};

export default plugin;

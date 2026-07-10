import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { expandScript } from '../util.ts';

export const resolve: BinaryResolver = (_binary, args, options) => {
  const { fromArgs, manifest } = options;
  const parsed = parseArgs(args, { '--': true });
  const [command, script] = parsed._;
  const _childArgs = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--'], { knownBinsOnly: true }) : [];
  if (command === 'exec') return _childArgs;
  if (command === 'run' && manifest.scriptNames.has(script)) {
    return expandScript(script, parsed['--'] ?? [], manifest.scripts, options) ?? _childArgs;
  }
  return [];
};

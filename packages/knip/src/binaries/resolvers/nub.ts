import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary, toEntry } from '../../util/input.ts';
import { isAbsolute, join } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';
import { resolveX } from './bunx.ts';

const runtimes = new Set(['x', 'dlx', 'exec']);

const runners = new Set(['run', 'watch']);

const commands = new Set([
  'add',
  'approve-builds',
  'audit',
  'ci',
  'create',
  'init',
  'install',
  'link',
  'node',
  'outdated',
  'pm',
  'publish',
  'remove',
  'unlink',
  'update',
  'why',
]);

export const resolve: BinaryResolver = (_binary, words, options) => {
  const binary = toBinary(_binary);
  const { manifest, cwd, fromArgs } = options;
  const parsed = parseArgs(words, { string: ['filter'], boolean: ['recursive'], alias: { recursive: 'r' } });
  const [command, script] = parsed._;

  if (runtimes.has(command)) {
    const rest = words.filter(word => word.value !== command);
    return [binary, ...resolveX(rest, options)];
  }

  if (parsed.recursive || parsed.filter) return [binary];

  if (runners.has(command)) {
    if (!script || manifest.scriptNames.has(script)) return [binary];
    const resolved = _resolveSync(isAbsolute(script) ? script : join(cwd, script), cwd);
    return resolved ? [binary, toEntry(resolved)] : [binary];
  }

  if (command && (commands.has(command) || manifest.scriptNames.has(command))) return [binary];

  return [binary, ...fromArgs(['node', ...words])];
};

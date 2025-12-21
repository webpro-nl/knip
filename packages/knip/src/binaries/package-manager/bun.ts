import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toEntry } from '../../util/input.js';
import { isAbsolute, join } from '../../util/path.js';
import { _resolveSync } from '../../util/resolve.js';
import { resolveX } from './bunx.js';

const commands = [
  'add',
  'audit',
  'build',
  'ci',
  'create',
  'exec',
  'feedback',
  'info',
  'init',
  'install',
  'link',
  'outdated',
  'patch',
  'pm',
  'publish',
  'remove',
  'repl',
  'run',
  'test',
  'unlink',
  'update',
  'upgrade',
  'why',
  'x',
];

export const resolve: BinaryResolver = (_binary, args, options) => {
  const parsed = parseArgs(args, { string: ['cwd'] });
  const [command, script] = parsed._;

  if (command === 'x') {
    const argsForX = args.filter(arg => arg !== 'x');
    return resolveX(argsForX, options);
  }

  const { manifestScriptNames, cwd, fromArgs } = options;

  if (command === 'run' && manifestScriptNames.has(script)) return [];
  if (manifestScriptNames.has(command)) return [];
  if (command === 'test') return parsed._.filter(id => id !== command).map(toEntry);
  if (command !== 'run' && commands.includes(command)) return [];

  const filePath = command === 'run' ? script : command;
  if (!filePath) return [];
  const _cwd = parsed.cwd ? join(cwd, parsed.cwd) : cwd;
  const resolved = _resolveSync(isAbsolute(filePath) ? filePath : join(_cwd, filePath), _cwd);
  if (resolved) return [toEntry(resolved)];

  const dir = parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  const opts = dir ? { cwd: dir } : {};
  return command === 'run' ? [] : fromArgs(args, opts);
};

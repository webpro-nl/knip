import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary, toEntry } from '../../util/input.ts';
import { isAbsolute, join } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';
import { argsAfter, expandScript } from '../util.ts';
import { resolveX } from './bunx.ts';

const commands = new Set([
  'add',
  'audit',
  'auth',
  'build',
  'c',
  'ci',
  'cloud',
  'completions',
  'config',
  'create',
  'deploy',
  'discord',
  'exec',
  'feedback',
  'fuzzilli',
  'getcompletes',
  'help',
  'i',
  'info',
  'init',
  'install',
  'link',
  'list',
  'login',
  'logout',
  'outdated',
  'patch',
  'patch-commit',
  'pm',
  'prune',
  'publish',
  'r',
  'remove',
  'repl',
  'rm',
  'run',
  'test',
  'unlink',
  'uninstall',
  'update',
  'upgrade',
  'use',
  'whoami',
  'why',
  'x',
]);

export const resolve: BinaryResolver = (_binary, args, options) => {
  const binary = toBinary(_binary);
  const parsed = parseArgs(args, { string: ['cwd'] });
  const [command, script] = parsed._;

  if (command === 'x') {
    const argsForX = args.filter(arg => arg !== 'x');
    return [binary, ...resolveX(argsForX, options)];
  }

  const { manifest, cwd, fromArgs } = options;

  if (command === 'run' && manifest.scriptNames.has(script)) {
    return [binary, ...(expandScript(script, argsAfter(args, script), manifest.scripts, options) ?? [])];
  }
  if (manifest.scriptNames.has(command)) {
    return [binary, ...(expandScript(command, argsAfter(args, command), manifest.scripts, options) ?? [])];
  }
  if (command !== 'run' && commands.has(command)) return [binary];

  const filePath = command === 'run' ? script : command;
  if (!filePath) return [binary];
  const _cwd = parsed.cwd ? join(cwd, parsed.cwd) : cwd;
  const resolved = _resolveSync(isAbsolute(filePath) ? filePath : join(_cwd, filePath), _cwd);
  if (resolved) return [binary, toEntry(resolved)];

  const dir = parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  const opts = dir ? { cwd: dir } : {};
  if (command !== 'run') return [binary, ...fromArgs(args, opts)];

  const input = toBinary(filePath, { optional: true });
  if (dir) input.dir = dir;
  return [binary, input];
};

import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary } from '../../util/input.js';
import { resolveDlx } from './pnpx.js';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'audit',
  'bin',
  'config',
  'dedupe',
  'deploy',
  'dlx',
  'doctor',
  'env',
  'fetch',
  'i',
  'import',
  'init',
  'install-test',
  'install',
  'it',
  'licenses',
  'link',
  'list',
  'ln',
  'ls',
  'outdated',
  'outdated',
  'pack',
  'patch-commit',
  'patch-remove',
  'patch',
  'prune',
  'publish',
  'rb',
  'rebuild',
  'remove',
  'rm',
  'root',
  'run',
  'server',
  'setup',
  'start',
  'store',
  't',
  'test',
  'tst',
  'un',
  'uninstall',
  'unlink',
  'up',
  'update',
  'upgrade',
  'why',
];

export const resolve: BinaryResolver = (binary, args, options) => {
  const bin = toBinary(binary);
  const parsed = parseArgs(args, {
    boolean: ['recursive', 'silent', 'shell-mode'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c' },
  });
  const [command, __binary] = parsed._;

  if (command === 'dlx') {
    const argsForDlx = args.filter(arg => arg !== 'dlx');
    return [toBinary(binary), ...resolveDlx(argsForDlx, options)];
  }

  const { manifestScriptNames, fromArgs } = options;
  if (manifestScriptNames.has(command) || commands.includes(command)) return [bin];
  if (command === 'exec') {
    if (parsed._.length > 2) return [bin, toBinary(__binary), ...fromArgs(parsed._.slice(1))];
    return [bin, toBinary(__binary)];
  }
  return command ? [bin, toBinary(command)] : [bin];
};

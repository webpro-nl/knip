import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary } from '../../util/input.js';
import { resolveDlx } from './pnpx.js';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'audit',
  'bin',
  'cache',
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
  'prepare',
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
  'version',
  'why',
];

export const resolve: BinaryResolver = (_binary, args, options) => {
  const parsed = parseArgs(args, {
    boolean: ['recursive', 'silent', 'shell-mode'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c', filter: 'F' },
  });
  const [command] = parsed._;

  if (command === 'dlx') {
    const argsForDlx = args.filter(arg => arg !== 'dlx');
    return resolveDlx(argsForDlx, options);
  }

  const { manifestScriptNames, fromArgs } = options;

  if (parsed.filter) return [];

  if (manifestScriptNames.has(command) || commands.includes(command)) return [];

  if (command === 'exec') return fromArgs(parsed._.slice(1));

  return command ? [toBinary(command)] : [];
};

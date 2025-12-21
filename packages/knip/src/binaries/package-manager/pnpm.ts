import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary } from '../../util/input.js';
import { resolveDlx } from './pnpx.js';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'approve-builds',
  'audit',
  'bin',
  'cache',
  'cat-file',
  'cat-index',
  'config',
  'dedupe',
  'deploy',
  'dlx',
  'doctor',
  'env',
  'fetch',
  'find-hash',
  'i',
  'ignored-builds',
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
  'self-update',
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
    '--': true,
  });
  const [command] = parsed._;

  if (command === 'dlx') {
    const argsForDlx = args.filter(arg => arg !== 'dlx');
    return resolveDlx(argsForDlx, options);
  }

  const { manifestScriptNames, fromArgs } = options;

  if (parsed.filter && !parsed.recursive) return [];

  const childInputs = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--']) : [];

  if (command === 'exec') {
    return childInputs.length > 0 ? childInputs : fromArgs(parsed._.slice(1));
  }

  const isScript = manifestScriptNames.has(command);
  if (isScript || commands.includes(command)) return childInputs;

  return command ? [toBinary(command)] : [];
};

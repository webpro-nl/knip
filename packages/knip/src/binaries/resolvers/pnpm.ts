import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary } from '../../util/input.ts';
import { isValidBinary } from '../../util/modules.ts';
import { resolveDlx } from './pnpx.ts';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'approve-builds',
  'audit',
  'bin',
  'cache',
  'cat-file',
  'cat-index',
  'ci',
  'clean',
  'config',
  'dedupe',
  'deploy',
  'dlx',
  'docs',
  'doctor',
  'env',
  'fetch',
  'find-hash',
  'home',
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
  'pack-app',
  'patch-commit',
  'patch-remove',
  'patch',
  'peers',
  'ping',
  'pkg',
  'pm',
  'prepare',
  'prune',
  'publish',
  'rb',
  'rebuild',
  'remove',
  'rm',
  'root',
  'run',
  'runtime',
  'sbom',
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
  'with',
];

export const resolve: BinaryResolver = (_binary, args, options) => {
  const parsed = parseArgs(args, {
    boolean: ['aggregate-output', 'if-present', 'parallel', 'recursive', 'reverse', 'shell-mode', 'silent', 'stream'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c', filter: 'F' },
    '--': true,
  });
  const [command] = parsed._;

  if (command === 'dlx') {
    const argsForDlx = args.filter(arg => arg !== 'dlx');
    return resolveDlx(argsForDlx, options);
  }

  const { manifest, fromArgs } = options;

  if (parsed.filter && !parsed.recursive) return [];

  const childInputs = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--'], { knownBinsOnly: true }) : [];

  if (command === 'exec') {
    return childInputs.length > 0 ? childInputs : fromArgs(parsed._.slice(1));
  }

  const isScript = manifest.scriptNames.has(command);
  if (isScript || commands.includes(command)) return childInputs;

  return command && isValidBinary(command) ? [toBinary(command)] : [];
};

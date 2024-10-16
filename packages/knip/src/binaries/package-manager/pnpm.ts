import parseArgs from 'minimist';
import type { Resolver } from '../../types/config.js';
import { toBinary } from '../../util/dependencies.js';

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

export const resolve: Resolver = (_binary, args, { manifestScriptNames, fromArgs }) => {
  const parsed = parseArgs(args, {
    boolean: ['recursive', 'silent', 'shell-mode'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c' },
  });
  const [command, binary] = parsed._;
  if (manifestScriptNames.has(command) || commands.includes(command)) return [];
  if (command === 'exec') {
    if (parsed._.length > 2) return [toBinary(binary), ...fromArgs(parsed._.slice(1))];
    return [toBinary(binary)];
  }
  return command ? [toBinary(command)] : [];
};

import parseArgs from 'minimist';
import { toBinary } from '../util.js';
import type { Resolver } from '../types.js';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'audit',
  'dedupe',
  'dlx',
  'fetch',
  'i',
  'import',
  'install-test',
  'install',
  'it',
  'link',
  'list',
  'ln',
  'ls',
  'outdated',
  'patch-commit',
  'patch',
  'prune',
  'rb',
  'rebuild',
  'remove',
  'rm',
  'run',
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

export const resolve: Resolver = (_binary, args, { manifest }) => {
  const scripts = manifest.scripts ? Object.keys(manifest.scripts) : [];
  const parsed = parseArgs(args, {});
  const [command, binary] = parsed._;
  if (scripts.includes(command) || commands.includes(command)) return [];
  if (command === 'exec') return [toBinary(binary)];
  return command ? [toBinary(command)] : [];
};

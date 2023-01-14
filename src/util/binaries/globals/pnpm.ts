import type { PackageJson } from 'type-fest';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'i',
  'install',
  'up',
  'update',
  'upgrade',
  'remove',
  'rm',
  'uninstall',
  'un',
  'link',
  'ln',
  'unlink',
  'import',
  'rebuild',
  'rb',
  'prune',
  'fetch',
  'install-test',
  'it',
  'patch',
  'patch-commit',
  'audit',
  'list',
  'ls',
  'outdated',
  'why',
  'test',
  't',
  'tst',
];

export const resolve = (binary: string, args: string[], manifest: PackageJson) => {
  const scripts = manifest.scripts ? Object.keys(manifest.scripts) : [];
  const [command, ...commandArgs] = args;
  if (scripts.includes(command) || commands.includes(command)) return [];
  if (command === 'run' && scripts.includes(commandArgs[0])) return [];
  if (command === 'run' || command === 'exec') return commandArgs.find(arg => !arg.startsWith('-'));
  return args.find(arg => !arg.startsWith('-'));
};

import type { PackageJson } from 'type-fest';

// https://yarnpkg.com/cli

const commands = [
  'add',
  'bin',
  'cache',
  'config',
  'constraints',
  'dedupe',
  'dlx',
  'explain',
  'info',
  'init',
  'install',
  'link',
  'pack',
  'patch',
  'patch-commit',
  'plugin',
  'rebuild',
  'remove',
  'search',
  'set',
  'stage',
  'unlink',
  'unplug',
  'up',
  'upgrade-interactive',
  'version',
  'why',
  'workspace',
  'workspaces',
];

export const resolve = (binary: string, args: string[], manifest: PackageJson) => {
  const scripts = manifest.scripts ? Object.keys(manifest.scripts) : [];
  const [command, ...commandArgs] = args;
  if (scripts.includes(command) || commands.includes(command)) return [];
  if (command === 'run' && scripts.includes(commandArgs[0])) return [];
  if (command === 'run' || command === 'exec') return commandArgs.find(arg => !arg.startsWith('-'));
  return args.find(arg => !arg.startsWith('-'));
};

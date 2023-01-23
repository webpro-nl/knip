import parseArgs from 'minimist';
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
  const parsed = parseArgs(args, {});
  const [command, result] = parsed._;
  if (scripts.includes(command) || commands.includes(command)) return [];
  if (command === 'run' && scripts.includes(result)) return [];
  if (command === 'run' || command === 'exec') return [result];
  return command ? [command] : [];
};

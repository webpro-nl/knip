import parseArgs from 'minimist';
import { toBinary } from '../../util/protocols.js';
import type { Resolver } from '../types.js';

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
  'patch-commit',
  'patch',
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
  'upgrade',
  'version',
  'why',
  'workspace',
  'workspaces',
];

export const resolve: Resolver = (_binary, args, { manifestScriptNames, fromArgs }) => {
  const parsed = parseArgs(args, {});
  const [command, binary] = parsed._;
  if (manifestScriptNames.has(command) || commands.includes(command)) return [];
  if (command === 'run' && manifestScriptNames.has(binary)) return [];
  if (command === 'run' || command === 'exec') return [toBinary(binary)];
  if (command === 'node') return fromArgs(parsed._);
  return command ? [toBinary(command)] : [];
};

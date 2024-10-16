import parseArgs from 'minimist';
import type { Resolver } from '../../types/config.js';
import { toBinary } from '../../util/dependencies.js';
import { join } from '../../util/path.js';

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

export const resolve: Resolver = (_binary, args, { manifestScriptNames, fromArgs, cwd, rootCwd }) => {
  const parsed = parseArgs(args, { boolean: ['top-level'], string: ['cwd'] });
  const [command, binary] = parsed._;
  const dir = parsed['top-level'] ? rootCwd : parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  if ((!dir && manifestScriptNames.has(command)) || commands.includes(command)) return [];
  if (!dir && command === 'run' && manifestScriptNames.has(binary)) return [];
  if (command === 'run' || command === 'exec') return dir ? [{ ...toBinary(binary), dir }] : [toBinary(binary)];
  if (command === 'node') return fromArgs(parsed._);
  return command ? (dir ? [{ ...toBinary(command), dir }] : [toBinary(command)]) : [];
};

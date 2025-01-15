import parseArgs from 'minimist';
import type { BinaryResolver } from '../../types/config.js';
import { toBinary } from '../../util/input.js';
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
  'global',
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

export const resolve: BinaryResolver = (_binary, args, { manifestScriptNames, fromArgs, cwd, rootCwd }) => {
  const parsed = parseArgs(args, { boolean: ['top-level'], string: ['cwd'] });
  const [command, binary] = parsed._;
  const dir = parsed['top-level'] ? rootCwd : parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  if ((!dir && manifestScriptNames.has(command)) || commands.includes(command)) return [];
  if (!dir && command === 'run' && manifestScriptNames.has(binary)) return [];
  if (command === 'node') return fromArgs(parsed._);
  const bin = command === 'run' || command === 'exec' ? toBinary(binary) : toBinary(command);
  if (dir) Object.assign(bin, { dir });
  return [bin];
};

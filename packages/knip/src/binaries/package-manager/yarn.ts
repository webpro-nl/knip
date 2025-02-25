import parseArgs from 'minimist';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.js';
import { isBinary, isDependency, toBinary, toDependency } from '../../util/input.js';
import { stripVersionFromSpecifier } from '../../util/modules.js';
import { join } from '../../util/path.js';
import { argsFrom } from '../util.js';

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

const resolveDlx = (args: string[], options: BinaryResolverOptions) => {
  const parsed = parseArgs(args, {
    boolean: ['quiet'],
    alias: { package: 'p', quiet: 'q' },
  });
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = specifier ? options.fromArgs(parsed._) : [];
  return [...packages.map(id => toDependency(id)), ...command].map(id =>
    isDependency(id) || isBinary(id) ? Object.assign(id, { optional: true }) : id
  );
};

export const resolve: BinaryResolver = (_binary, args, options) => {
  const { manifestScriptNames, fromArgs, cwd, rootCwd } = options;
  const parsed = parseArgs(args, { boolean: ['top-level'], string: ['cwd'] });
  const dir = parsed['top-level'] ? rootCwd : parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  const [command, binary] = parsed._;

  if (command === 'run') {
    if (manifestScriptNames.has(binary)) return [];
    const bin = toBinary(binary, { optional: true });
    if (dir) Object.assign(bin, { dir });
    return [bin];
  }

  if (command === 'node') return fromArgs(parsed._);

  if (command === 'dlx') {
    const argsForDlx = args.filter(arg => arg !== 'dlx');
    return resolveDlx(argsForDlx, options);
  }

  if ((!dir && manifestScriptNames.has(command)) || commands.includes(command)) return [];

  const opts = dir ? { cwd: dir } : {};
  return fromArgs(argsFrom(args, command === 'exec' ? binary : command), opts);
};

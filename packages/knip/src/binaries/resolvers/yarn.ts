import type { Word } from 'unbash';
import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver, BinaryResolverOptions } from '../../types/config.ts';
import { isBinary, isDependency, toBinary, toDependency } from '../../util/input.ts';
import { stripVersionFromSpecifier } from '../../util/modules.ts';
import { join } from '../../util/path.ts';
import { argsAfter, argsFrom, expandScript, toWordArgs } from '../util.ts';

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
  'publish',
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

const resolveDlx = (words: Word[], options: BinaryResolverOptions) => {
  const parsed = parseArgs(words, {
    boolean: ['quiet'],
    alias: { package: 'p', quiet: 'q' },
  });
  const packageSpecifier = parsed._[0];
  const specifier = packageSpecifier ? stripVersionFromSpecifier(packageSpecifier) : '';
  const packages = parsed.package && !parsed.yes ? [parsed.package].flat().map(stripVersionFromSpecifier) : [];
  const command = specifier ? options.fromArgs(toWordArgs(parsed._, words)) : [];
  return [...packages.map(id => toDependency(id)), ...command].map(id =>
    isDependency(id) || isBinary(id) ? Object.assign(id, { optional: true }) : id
  );
};

export const resolve: BinaryResolver = (_binary, words, options) => {
  const { manifest, fromArgs, cwd, rootCwd, getManifest } = options;
  const parsed = parseArgs(words, { boolean: ['top-level'], string: ['cwd'], '--': true });
  const dir = parsed['top-level'] ? rootCwd : parsed.cwd ? join(cwd, parsed.cwd) : undefined;
  const [command, binary] = parsed._;

  if (!command && !binary) return [];

  const dirManifest = (dir && getManifest(dir)) || manifest;
  const _childArgs =
    parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { knownBinsOnly: true }) : [];

  if (command === 'run') {
    if (dirManifest.scriptNames.has(binary)) {
      const opts = dir ? { cwd: dir, manifest: dirManifest } : {};
      return expandScript(binary, argsAfter(words, binary), dirManifest.scripts, options, opts) ?? _childArgs;
    }
    const bin = toBinary(binary, { optional: true });
    if (dir) Object.assign(bin, { dir });
    return [bin, ..._childArgs];
  }

  if (command === 'node') return fromArgs(toWordArgs(parsed._, words));

  if (command === 'dlx') {
    const wordsForDlx = words.filter(word => word.value !== 'dlx');
    return resolveDlx(wordsForDlx, options);
  }

  if (dirManifest.scriptNames.has(command)) {
    const opts = dir ? { cwd: dir, manifest: dirManifest } : {};
    return expandScript(command, argsAfter(words, command), dirManifest.scripts, options, opts) ?? _childArgs;
  }
  if (commands.includes(command)) return _childArgs;

  const opts = dir ? { cwd: dir } : {};
  if (command === 'exec') {
    const rest = argsFrom(words, binary);
    return rest.length === 1 ? fromArgs([rest[0].value], opts) : fromArgs(rest, opts);
  }
  return fromArgs(argsFrom(words, command), opts);
};

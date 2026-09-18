import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary } from '../../util/input.ts';
import { isValidBinary } from '../../util/modules.ts';
import { argsAfter, expandScript } from '../util.ts';
import { resolveDlx } from './pnpx.ts';

// https://pnpm.io/cli/add

const commands = [
  'add',
  'approve-builds',
  'audit',
  'bin',
  'cache',
  'cat-file',
  'cat-index',
  'ci',
  'clean-install',
  'clean',
  'config',
  'create',
  'dedupe',
  'deploy',
  'dlx',
  'docs',
  'doctor',
  'env',
  'fetch',
  'find-hash',
  'home',
  'i',
  'ic',
  'ignored-builds',
  'import',
  'info',
  'init',
  'install-clean',
  'install-test',
  'install',
  'it',
  'la',
  'licenses',
  'link',
  'list',
  'll',
  'ln',
  'login',
  'logout',
  'ls',
  'outdated',
  'pack-app',
  'pack',
  'patch-commit',
  'patch-remove',
  'patch',
  'peers',
  'ping',
  'pkg',
  'pm',
  'prepare',
  'prune',
  'publish',
  'purge',
  'rb',
  'rebuild',
  'remove',
  'rm',
  'root',
  'rt',
  'run',
  'runtime',
  'sbom',
  'self-update',
  'server',
  'setup',
  'stage',
  'start',
  'store',
  't',
  'test',
  'token',
  'tst',
  'un',
  'uninstall',
  'unlink',
  'up',
  'update',
  'upgrade',
  'version',
  'view',
  'why',
  'with',
];

const recursiveCommands = ['recursive', 'multi', 'm'];

export const resolve: BinaryResolver = (_binary, words, options) => {
  const parseOptions = {
    isStorePositions: true,
    boolean: ['aggregate-output', 'if-present', 'parallel', 'recursive', 'reverse', 'shell-mode', 'silent', 'stream'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c', filter: 'F' },
    '--': true,
  };
  const parsed = parseArgs(words, parseOptions);
  const [command] = parsed._;

  if (command === 'dlx') {
    const wordsForDlx = words.filter(word => word.value !== 'dlx');
    return resolveDlx(wordsForDlx, options);
  }

  if (recursiveCommands.includes(command)) {
    return resolve(_binary, argsAfter(words, command), options);
  }

  const { manifest, fromArgs } = options;

  if (command === 'exec') {
    const commandIndex = parsed.positionalIndices![0];
    if (commandIndex > 0) {
      const execOptions = parseArgs(words.slice(0, commandIndex), parseOptions);
      if (execOptions.filter && !execOptions.recursive) return [];
    }
    const index = commandIndex + 1;
    const rest = words.slice(words[index]?.value === '--' ? index + 1 : index);
    return fromArgs([rest.length === 1 ? rest[0].value : rest.map(word => word.text).join(' ')]);
  }

  if (parsed.filter && !parsed.recursive) return [];

  const childInputs =
    parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { knownBinsOnly: true }) : [];

  if (command === 'run') {
    const script = parsed._[1];
    if (script && manifest.scriptNames.has(script)) {
      return expandScript(script, argsAfter(words, script), manifest.scripts, options) ?? childInputs;
    }
    return childInputs;
  }

  const isScript = manifest.scriptNames.has(command);
  if (isScript) return expandScript(command, argsAfter(words, command), manifest.scripts, options) ?? childInputs;
  if (commands.includes(command)) return childInputs;

  return command && isValidBinary(command) ? [toBinary(command)] : [];
};

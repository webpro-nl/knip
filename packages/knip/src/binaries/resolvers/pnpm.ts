import parseArgs from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toBinary } from '../../util/input.ts';
import { isValidBinary } from '../../util/modules.ts';
import { argsAfter, expandScript, toWordArgs } from '../util.ts';
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
  'start',
  'store',
  't',
  'test',
  'tst',
  'un',
  'uninstall',
  'unlink',
  'up',
  'update',
  'upgrade',
  'version',
  'why',
  'with',
];

export const resolve: BinaryResolver = (_binary, words, options) => {
  const parsed = parseArgs(words, {
    boolean: ['aggregate-output', 'if-present', 'parallel', 'recursive', 'reverse', 'shell-mode', 'silent', 'stream'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c', filter: 'F' },
    '--': true,
  });
  const [command] = parsed._;

  if (command === 'dlx') {
    const wordsForDlx = words.filter(word => word.value !== 'dlx');
    return resolveDlx(wordsForDlx, options);
  }

  const { manifest, fromArgs } = options;

  if (parsed.filter && !parsed.recursive) return [];

  const childInputs =
    parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { knownBinsOnly: true }) : [];

  if (command === 'exec') {
    if (childInputs.length > 0) return childInputs;
    const rest = parsed._.slice(1);
    return rest.length === 1 ? fromArgs(rest.map(String)) : fromArgs(toWordArgs(rest, words));
  }

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

import parseArgs, { type ParsedArgs } from '../../util/parse-args.ts';
import type { BinaryResolver } from '../../types/config.ts';
import { toAbsolute } from '../../util/path.ts';
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

const testAliases = new Set(['t', 'tst']);

export const resolve: BinaryResolver = (_binary, words, options) => {
  const parseOptions = {
    isStorePositions: true,
    string: ['dir'],
    boolean: ['aggregate-output', 'if-present', 'parallel', 'recursive', 'reverse', 'shell-mode', 'silent', 'stream'],
    alias: { recursive: 'r', silent: 's', 'shell-mode': 'c', filter: 'F', dir: 'C' },
    '--': true,
  };
  const parsed = parseArgs(words, parseOptions);
  const [command] = parsed._;
  const [commandIndex, scriptIndex] = parsed.positionalIndices!;

  if (command === 'dlx') {
    const wordsForDlx = words.filter(word => word.value !== 'dlx');
    return resolveDlx(wordsForDlx, options);
  }

  if (recursiveCommands.includes(command)) {
    return resolve(_binary, argsAfter(words, command), options);
  }

  const { manifest, fromArgs } = options;

  const forward = (index: number, pnpmOptions: ParsedArgs) => {
    const rest = words.slice(index);
    const script = rest.length === 1 ? rest[0].value : rest.map(word => word.text).join(' ');
    if (!pnpmOptions.dir) return fromArgs([script]);
    const dir = toAbsolute(pnpmOptions.dir, options.cwd);
    const inputs = fromArgs([script], { cwd: dir });
    for (const input of inputs) input.dir ??= dir;
    return inputs;
  };

  const isRun = command === 'run' || command === 'run-script';
  const pnpmOptions = parseArgs(words.slice(0, isRun ? scriptIndex : commandIndex), parseOptions);
  if (pnpmOptions.filter && !pnpmOptions.recursive) return [];

  if (command === 'exec') {
    const index = commandIndex + 1;
    return forward(words[index]?.value === '--' ? index + 1 : index, pnpmOptions);
  }

  const childInputs =
    parsed['--'] && parsed['--'].length > 0 ? fromArgs(argsAfter(words, '--'), { isForwardedArgs: true }) : [];

  if (isRun) {
    const script = parsed._[1];
    if (script && manifest.scriptNames.has(script)) {
      return expandScript(script, argsAfter(words, script), manifest.scripts, options) ?? childInputs;
    }
    return childInputs;
  }

  const name = testAliases.has(command) ? 'test' : command;
  const isScript = manifest.scriptNames.has(name);
  if (isScript) return expandScript(name, argsAfter(words, command), manifest.scripts, options) ?? childInputs;
  if (commands.includes(command)) return childInputs;

  return command ? forward(commandIndex, pnpmOptions) : [];
};

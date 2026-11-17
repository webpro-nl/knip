import type { GetScriptCommands, IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { isGlobLike, nodeLoadersArgs } from '../../binaries/util.ts';
import { type Input, toEntry, toEntryPath, toModule } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import type { RegisterVisitors } from '../../types/config.ts';
import { createFsPromisesGlobVisitor } from './visitors/fsPromisesGlob.ts';

const title = 'Node.js';

const isEnabled: IsPluginEnabled = () => true;

// From https://nodejs.org/api/test.html#running-tests-from-the-command-line
const patterns = [
  '**/*{.,-,_}test.{cjs,mjs,js,cts,mts,ts}',
  '**/test-*.{cjs,mjs,js,cts,mts,ts}',
  '**/test.{cjs,mjs,js,cts,mts,ts}',
  '**/test/**/*.{cjs,mjs,js,cts,mts,ts}',
];

const hasNodeTestCache = new WeakMap<Record<string, string>, boolean>();

const hasNodeTest = (
  scripts: Record<string, string> | undefined,
  cwd: string,
  getScriptCommands: GetScriptCommands
) => {
  if (!scripts) return false;
  const cached = hasNodeTestCache.get(scripts);
  if (cached !== undefined) return cached;
  const result = Object.values(scripts).some(
    script =>
      typeof script === 'string' &&
      getScriptCommands(script, cwd).some(
        ({ binary, args }) => (binary === 'node' || binary === 'nub') && args.includes('--test')
      )
  );
  hasNodeTestCache.set(scripts, result);
  return result;
};

const entry = ['server.js'];

const builtInReporters = new Set(['spec', 'tap', 'dot', 'junit', 'lcov']);

const registerVisitors: RegisterVisitors = ({ ctx, registerVisitor }) => {
  registerVisitor(createFsPromisesGlobVisitor(ctx));
};

const resolve: Resolve = options => {
  const entries = entry.map(id => toEntry(id, { production: true }));

  if (
    hasNodeTest(options.manifest.scripts, options.cwd, options.getScriptCommands) ||
    hasNodeTest(options.rootManifest?.scripts, options.rootCwd, options.getScriptCommands)
  ) {
    entries.push(...patterns.map(id => toEntry(id)));
  }

  return entries;
};

export const args = {
  positional: true,
  nodeImportArgs: true,
  string: ['test-reporter'],
  boolean: [
    'deprecation',
    'enable-source-maps',
    'experimental-detect-module',
    'experimental-json-modules',
    'experimental-require-module',
    'experimental-sqlite',
    'experimental-strip-types',
    'experimental-test-coverage',
    'experimental-test-module-mocks',
    'experimental-transform-types',
    'experimental-vm-modules',
    'experimental-wasm-modules',
    'expose-gc',
    'harmony',
    'inspect-brk',
    'inspect-wait',
    'inspect',
    'openssl-legacy-provider',
    'preserve-symlinks',
    'test-only',
    'test',
    'trace-deprecation',
    'trace-warnings',
    'warnings',
    'watch-preserve-output',
    'watch',
  ],
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    for (const id of [parsed['test-reporter'] ?? []].flat()) if (!builtInReporters.has(id)) inputs.push(toModule(id));
    const script = parsed['--']?.[0];
    if (parsed._.length > 0 || !script || script.startsWith('-')) return inputs;
    const isOff = (key: string) => [parsed[key]].flat().every(value => value === false);
    const isDeclared = (key: string) => key === '_' || key === '--' || isOff(key) || declaredOptions.has(key);
    if (!Object.keys(parsed).every(isDeclared)) return inputs;
    inputs.push(isGlobLike(script) ? toEntry(script) : toEntryPath(script, { optional: true }));
    return inputs;
  },
};

// Node runs the first argument after `--` as the script, but an undeclared option before it (`--run`, `-e`) may
// select another mode, so the argument is only an entry when every option is one of these
const declaredOptions = new Set([...Object.entries(nodeLoadersArgs).flat(2), ...args.string, ...args.boolean]);

const plugin: Plugin = {
  title,
  isEnabled,
  entry,
  resolve,
  args,
  registerVisitors,
};

export default plugin;

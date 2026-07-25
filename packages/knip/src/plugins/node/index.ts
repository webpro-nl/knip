import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toEntry, toProductionEntry } from '../../util/input.ts';
import { getScriptCommands } from '../../util/scripts.ts';

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

const hasNodeTest = (scripts: Record<string, string> | undefined) => {
  if (!scripts) return false;
  const cached = hasNodeTestCache.get(scripts);
  if (cached !== undefined) return cached;
  const result = Object.values(scripts).some(
    script =>
      typeof script === 'string' &&
      getScriptCommands(script).some(
        ({ binary, args }) => (binary === 'node' || binary === 'nub') && args.includes('--test')
      )
  );
  hasNodeTestCache.set(scripts, result);
  return result;
};

const entry = ['server.js'];

const resolve: Resolve = options => {
  const entries = entry.map(id => toProductionEntry(id));

  if (hasNodeTest(options.manifest.scripts) || hasNodeTest(options.rootManifest?.scripts)) {
    entries.push(...patterns.map(toEntry));
  }

  return entries;
};

const args = {
  positional: true,
  nodeImportArgs: true,
  resolve: ['test-reporter'],
  boolean: [
    'deprecation',
    'experimental-strip-types',
    'experimental-transform-types',
    'harmony',
    'inspect-brk',
    'inspect-wait',
    'inspect',
    'test-only',
    'test',
    'warnings',
    'watch',
  ],
  args: (args: string[]) => args.filter(arg => !/--test-reporter[= ](spec|tap|dot|junit|lcov)/.test(arg)),
};

const plugin: Plugin = {
  title,
  isEnabled,
  entry,
  resolve,
  args,
};

export default plugin;

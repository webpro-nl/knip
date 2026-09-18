#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';
// oxlint-disable-next-line no-restricted-imports
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { globSync } from 'tinyglobby';

const { values } = parseArgs({
  options: {
    runtime: { type: 'string', default: 'bun' },
    smoke: { type: 'boolean', default: false },
    e2e: { type: 'boolean', default: false },
    shard: { type: 'string' },
  },
});

const useBun =
  values.runtime === 'bun' && spawnSync('bun', ['--version'], { stdio: 'ignore', shell: true }).status === 0;

const patterns = values.e2e
  ? ['test/e2e/**/*.test.ts']
  : values.smoke
    ? ['test/*.test.ts', 'test/!(cli|e2e|fix)/**/*.test.ts']
    : ['test/**/*.test.ts'];

const files = globSync(patterns);
if (files.length === 0) throw new Error('No test files found');
const concurrency = Math.min(4, availableParallelism());

const [major, minor] = process.versions.node.split('.').map(Number);
const nativeTS = major >= 24 || (major === 22 && minor >= 18);

const require = createRequire(import.meta.url);
const tsxBin = nativeTS ? null : resolve(dirname(require.resolve('tsx/package.json')), require('tsx/package.json').bin);

const result = useBun
  ? spawnSync(
      'bun',
      [
        'test',
        `--parallel=${concurrency}`,
        '--no-isolate',
        '--timeout',
        '30000',
        ...(values.shard ? [`--shard=${values.shard}`] : []),
        ...files,
      ],
      { stdio: 'inherit' }
    )
  : spawnSync(
      process.execPath,
      [...(tsxBin ? [tsxBin] : []), '--test', ...(values.shard ? [`--test-shard=${values.shard}`] : []), ...files],
      { stdio: 'inherit' }
    );

process.exit(result.status ?? 1);

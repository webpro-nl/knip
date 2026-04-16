#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
// oxlint-disable-next-line no-restricted-imports
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { globSync } from 'tinyglobby';

const { values } = parseArgs({
  options: {
    runtime: { type: 'string', default: 'bun' },
    smoke: { type: 'boolean', default: false },
  },
});

const useBun =
  values.runtime === 'bun' && spawnSync('bun', ['--version'], { stdio: 'ignore', shell: true }).status === 0;

const patterns = values.smoke
  ? ['test/*.test.ts', 'test/{plugins,util}/*.test.ts']
  : ['test/*.test.ts', 'test/**/*.test.ts'];

const files = globSync(patterns);

const [major, minor] = process.versions.node.split('.').map(Number);
const nativeTS = major >= 24 || (major === 22 && minor >= 18);

const require = createRequire(import.meta.url);
const tsxBin = nativeTS ? null : resolve(dirname(require.resolve('tsx/package.json')), require('tsx/package.json').bin);

const result = useBun
  ? spawnSync('bun', ['test', ...files], { stdio: 'inherit' })
  : spawnSync(process.execPath, [...(tsxBin ? [tsxBin] : []), '--test', ...files], { stdio: 'inherit' });

process.exit(result.status ?? 1);

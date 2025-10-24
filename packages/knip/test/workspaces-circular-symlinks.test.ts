import assert from 'node:assert/strict';
import test from 'node:test';
import { _syncGlob } from '../src/util/glob.js';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/workspaces-circular-symlinks');

test('syncGlob should not traverse circular symlinks', () => {
  const libACwd = resolve('fixtures/workspaces-circular-symlinks/packages/lib-a');
  const files = _syncGlob({ patterns: ['./**/*.ts'], cwd: libACwd });

  const expected = 1;
  assert.equal(files.length, expected, `Expected ${expected} file but found ${files.length}`);
  assert.equal(files[0], 'index.ts');
});

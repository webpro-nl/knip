import assert from 'node:assert/strict';
import test from 'node:test';
import { _syncGlob } from '../src/util/glob.js';
import { resolve } from './helpers/resolve.js';
import { join } from '../src/util/path.js';

test('syncGlob should not traverse circular symlinks', () => {
  const cwd = resolve('fixtures/workspaces-circular-symlinks/packages/lib-a');
  const files = _syncGlob({ patterns: ['./**/*.ts'], cwd: cwd });

  const expected = 1;
  assert.equal(files.length, expected, `Expected ${expected} file but found ${files.length}`);
  assert.equal(join(cwd, 'index.ts'), files[0]);
});

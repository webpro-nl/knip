import assert from 'node:assert/strict';
import test from 'node:test';
import { _syncGlob } from '../src/util/glob.ts';
import { resolve } from './helpers/resolve.ts';

test('syncGlob should not traverse circular symlinks', () => {
  const libACwd = resolve('fixtures/workspaces-circular-symlinks/packages/lib-a');
  const files = _syncGlob({ patterns: ['./**/*.ts'], cwd: libACwd });

  const expected = 1;
  assert.equal(files.length, expected, `Expected ${expected} file but found ${files.length}`);
  assert.equal(files[0], 'index.ts');
});

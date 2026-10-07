import assert from 'node:assert/strict';
import test from 'node:test';
import { _glob } from '../../src/util/glob.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode');

test('Return no paths when every pattern is empty or negated', async () => {
  assert.deepEqual(await _glob({ cwd, patterns: [''], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!'], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!src/**'], gitignore: false }), []);
});

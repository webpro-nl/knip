import assert from 'node:assert/strict';
import test from 'node:test';
import { _glob, rebasePattern } from '../../src/util/glob.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsc-files-mode');

test('Return no paths when every pattern is empty or negated', async () => {
  assert.deepEqual(await _glob({ cwd, patterns: [''], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!'], gitignore: false }), []);
  assert.deepEqual(await _glob({ cwd, patterns: ['!src/**'], gitignore: false }), []);
});

test('Rebase entry patterns onto the workspace directory', () => {
  const dir = '/repo';
  const base = '/repo/packages/app';
  assert.equal(rebasePattern('*.ts', base, dir), 'packages/app/*.ts');
  assert.equal(rebasePattern('!skip.ts', base, dir), '!packages/app/skip.ts');
  assert.equal(rebasePattern('/repo/packages/app/*.ts', base, dir), 'packages/app/*.ts');
  assert.equal(rebasePattern('!/repo/packages/app/skip.ts', base, dir), '!packages/app/skip.ts');
  assert.equal(rebasePattern('specs/**/*.js', base, dir), 'packages/app/specs/**/*.js');
  assert.equal(rebasePattern('./scripts/build.sh', base, dir), 'packages/app/scripts/build.sh');
  assert.equal(rebasePattern('*.ts', '/repo/packages/b', '/repo/packages/a'), '../b/*.ts');
  assert.equal(rebasePattern('!skip.ts', '/repo/packages/b', '/repo/packages/a'), '!../b/skip.ts');
});

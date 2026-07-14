import assert from 'node:assert/strict';
import test from 'node:test';
import { getPackageMapTarget } from '../../src/util/package-json.ts';

test('Return a root conditional exports map', () => {
  const target = { source: './src/index.ts', default: './dist/index.js' };

  assert.deepEqual(getPackageMapTarget(target, '.'), { target });
});

test('Prefer exact and more specific package subpath matches', () => {
  const exact = { source: './src/json.ts' };
  const map = {
    './formats/*': { source: './src/*.ts' },
    './formats/special/*': { source: './src/special/*.ts' },
    './formats/json': exact,
  };

  assert.deepEqual(getPackageMapTarget(map, './formats/json'), { target: exact });
  assert.deepEqual(getPackageMapTarget(map, './formats/special/json'), {
    target: map['./formats/special/*'],
    patternMatch: 'json',
  });
  assert.equal(getPackageMapTarget(map, './missing'), undefined);
});

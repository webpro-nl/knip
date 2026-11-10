import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/basic');

test('Support various ways to import modules', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 26,
    processed: 65,
    total: 65,
  });

  assert.deepEqual(Object.keys(issues.exports['promise-all-top-level.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['promise-all-scoped.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-member.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-destructure.ts']), ['unused']);
  assert.equal(issues.exports['promise-all-spread-namespace.ts'], undefined);
  assert.equal(issues.exports['promise-all-spread-named.ts'], undefined);
  assert.equal(issues.exports['then-namespace-arg.ts'], undefined);
  assert.equal(issues.exports['then-namespace-arg-member.ts'], undefined);
  assert.equal(issues.exports['await-namespace-arg.ts'], undefined);
  assert.equal(issues.exports['then-namespace-return.ts'], undefined);
  assert.equal(issues.exports['then-namespace-assign.ts'], undefined);
  assert.equal(issues.exports['then-namespace-spread.ts'], undefined);
  assert.equal(issues.exports['await-namespace-alias.ts'], undefined);
  assert.deepEqual(Object.keys(issues.exports['await-var-try.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['var-nested-init.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-namespace-scope.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['scope-top-level.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['scope-nested.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['scope-static.ts']), ['shared.unused']);
  assert.deepEqual(Object.keys(issues.exports['scope-shared.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['shadow-boundary.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-reject-arg.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['then-reject-static.ts']), ['sunused']);
  assert.deepEqual(Object.keys(issues.exports['shadow-destructured.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['shadow-class.ts']), ['unused']);
  assert.equal(issues.exports['container-dynamic.ts'], undefined);
  assert.deepEqual(Object.keys(issues.exports['container-static.ts']), ['cs.unused']);
  assert.equal(issues.exports['alias-dynamic.ts'], undefined);
  assert.deepEqual(Object.keys(issues.exports['alias-static.ts']), ['as.unused']);
  assert.deepEqual(Object.keys(issues.exports['var-then.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['var-then-static.ts']), ['vt.sunused']);
  assert.deepEqual(Object.keys(issues.exports['loop-shadow-static.ts']), ['ls.sunused']);
  assert.deepEqual(Object.keys(issues.exports['loop-shadow-dynamic.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['for-init-shadow.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['switch-shadow.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['container-shadow.ts']), ['unused']);
  assert.deepEqual(Object.keys(issues.exports['spread-shadow.ts']), ['unused']);
});

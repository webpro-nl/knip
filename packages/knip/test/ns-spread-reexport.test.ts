import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/ns-spread-reexport');

test('Should report members of re-exported spread namespace', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['fruits.ts']['Fruits.banana']);
  assert(issues.exports['animals.ts']['Animals.dog']);
  assert(issues.exports['colors.ts']['Colors.blue']);

  assert(!issues.exports['hello.resolver.ts']);
  assert(!issues.exports['utils.ts']);

  assert.deepStrictEqual(counters, {
    ...baseCounters,
    exports: 3,
    processed: 14,
    total: 14,
  });
});

test('Should report members of re-exported spread namespace (with nsExports)', async () => {
  const options = await createOptions({ cwd, includedIssueTypes: ['nsExports'] });
  const { issues, counters } = await main(options);

  assert(issues.exports['fruits.ts']['Fruits.banana']);
  assert(issues.exports['animals.ts']['Animals.dog']);
  assert(issues.exports['colors.ts']['Colors.blue']);

  assert(issues.nsExports['hello.resolver.ts']['resolverBarrel.Hello']);
  assert(issues.nsExports['utils.ts']['Utils.helper']);

  assert.deepStrictEqual(counters, {
    ...baseCounters,
    exports: 3,
    nsExports: 2,
    processed: 14,
    total: 14,
  });
});

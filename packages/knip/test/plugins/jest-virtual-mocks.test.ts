import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-virtual-mocks');

test('Resolve virtual Jest mock lookups within each file', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.unlisted['virtual.test.ts']?.['virtual-storage'], undefined);
  assert.equal(issues.unlisted['virtual.test.ts']?.['virtual-network']?.line, 9);
  assert.equal(issues.unlisted['aliased.test.ts']?.['virtual-clock'], undefined);
  assert.equal(issues.unlisted['virtual.test.ts']?.['quoted-search'], undefined);
  assert.equal(issues.unlisted['virtual.test.ts']?.['quoted-storage'], undefined);
  assert.equal(issues.unlisted['virtual.test.ts']?.['quoted-network']?.line, 16);
  assert.equal(issues.unlisted['virtual.test.ts']['virtual-search'].line, 3);
  assert(issues.unlisted['virtual.test.ts']['shadowed-search']);
  assert(issues.unlisted['aliased.test.ts']['virtual-storage']);
  assert.equal(issues.devDependencies['package.json']?.['esm-storage'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 5,
    processed: 2,
    total: 2,
  });
});

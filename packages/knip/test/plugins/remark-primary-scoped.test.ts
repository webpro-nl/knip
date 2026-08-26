import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/remark-primary-scoped');

test('Find dependencies with the Remark plugin (primary scoped candidate)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['remark-cli']);
  assert(issues.binaries['package.json']['remark']);
  assert.equal(issues.unlisted['package.json']?.['@scope/remark-pkg-b'], undefined);
  assert.equal(issues.unresolved['package.json']?.['@scope/remark-pkg-b'], undefined);
  assert.equal(issues.unlisted['package.json']?.['@scope/pkg-b'], undefined);
  assert.equal(issues.unresolved['package.json']?.['@scope/pkg-b'], undefined);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    devDependencies: 1,
    processed: 0,
    total: 0,
  });
});

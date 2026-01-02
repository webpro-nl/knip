import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/parcel');

test('Find dependencies with the Parcel plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['parcel']);
  assert(issues.unresolved['.parcelrc']['@parcel/config-default']);
  assert(issues.unresolved['.parcelrc']['@parcel/transformer-js']);
  assert(issues.unresolved['.parcelrc']['@parcel/transformer-react-refresh-wrap']);
  assert(issues.unresolved['.parcelrc']['@parcel/transformer-svg-react']);
  assert(issues.unresolved['.parcelrc']['@parcel/optimizer-terser']);
  assert(issues.unresolved['.parcelrc']['@parcel/optimizer-cssnano']);
  assert(issues.unresolved['.parcelrc']['@parcel/reporter-cli']);
  assert(issues.unresolved['.parcelrc']['@parcel/reporter-bundle-analyzer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    binaries: 1,
    unresolved: 8,
    processed: 0,
    total: 0,
  });
});

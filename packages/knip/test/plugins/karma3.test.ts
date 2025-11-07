import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/karma3');

test('Find dependencies with the Karma plugin (plugin dependencies)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.ok(issues.unlisted['karma.conf.js']['karma-jasmine']);
  assert.ok(issues.unlisted['karma.conf.js']['karma-coverage']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 2,
    processed: 2,
    total: 2,
  });
});

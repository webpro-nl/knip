import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/semantic-release');

test('Find dependencies with the semantic-release plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['semantic-release']);

  assert(issues.unlisted['.releaserc']['@semantic-release/changelog']);
  assert(issues.unlisted['.releaserc']['@semantic-release/git']);

  assert(issues.unlisted['package.json']['@semantic-release/changelog']);
  assert(issues.unlisted['package.json']['@semantic-release/git']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 4,
    processed: 0,
    total: 0,
  });
});

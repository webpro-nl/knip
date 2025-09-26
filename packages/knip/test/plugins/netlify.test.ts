import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/netlify');

test('Find dependencies with the Netlify plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['netlify.toml']['netlify-plugin-check-output-for-puppy-references']);
  assert(issues.unlisted['netlify.toml']['package-1']);
  assert(issues.unlisted['netlify.toml']['package-2']);
  assert(issues.unlisted['netlify.toml']['package-3']);
  assert(issues.unlisted['netlify.toml']['package-4']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 5,
    processed: 0,
    total: 0,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/netlify');

test('Find dependencies with the Netlify plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

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

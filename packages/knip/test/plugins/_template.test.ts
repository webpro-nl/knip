import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/_template');

test('Find dependencies with the __PLUGIN_NAME__ plugin', async () => {
  /**
   * Ideally, plugin tests have no `issues` left and only `total` and `processed` values in `counters`.
   * This means for instance that a dependency used in a file, is also listed in package.json, resulting in zero issues.
   *
   * See `binaries` issues? This is an integration test, Knip might search in `node_modules` for `package.json#bin`.
   * Either we accept the missing binaries and count them as issues (`binaries: [n]`), or we add 2 fixture files:
   * → `node_modules/package-name/package.json` with a `bin` pointing to an existing empty `./index.js` file
   *
   * Sometimes the "Run Knip against external projects" workflow in CI (GitHub Action) fails, you can probably ignore.
   * All other workflows should be green though!
   *
   * Here's a link to the docs, just in case: https://knip.dev/writing-a-plugin
   *
   * Please remove this comment! 🔥
   */

  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 0,
    total: 0,
  });
});

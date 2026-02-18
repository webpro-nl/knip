import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/payload');

test('Find dependencies with the payload plugin', async () => {
  /**
   * Ideally, plugin tests have no `issues` left and only `total` and `processed` values in `counters`.
   * This means for instance that a dependency used in a file, is also listed in package.json, resulting in zero issues.
   *
   * Missing binaries? Add: node_modules/pkg/package.json with bin → ./index.js
   *
   * Failures in "Publish preview & run ecosystem tests" can usually be ignored, unless related to your changes.
   * All other workflows should be green though.
   *
   * Docs: https://knip.dev/writing-a-plugin
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

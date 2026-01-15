import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/ladle');

test('Find dependencies with the ladle plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.dependencies['package.json']['react-dom']);
  assert(issues.devDependencies['package.json']['@types/react-dom']);
  assert(issues.binaries['package.json']['ladle']);
  assert(issues.unlisted['.ladle/vite.config.ts']['vite']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    dependencies: 1,
    devDependencies: 1,
    unlisted: 1,
    processed: 5,
    total: 5,
  });
});

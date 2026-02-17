import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/pm2');
const cwdEcosystem = resolve('fixtures/plugins/pm2-ecosystem');

test('Find entry files with the pm2 plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.files.has(join(cwd, 'src/another.js')));
  assert(issues.files.has(join(cwd, 'src/unused.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

test('Find entry files with the pm2 plugin from ecosystem config', async () => {
  const options = await createOptions({ cwd: cwdEcosystem });
  const { issues, counters } = await main(options);

  assert(!issues.files.has(join(cwdEcosystem, 'src/another.js')));
  assert(issues.files.has(join(cwdEcosystem, 'src/unused.js')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

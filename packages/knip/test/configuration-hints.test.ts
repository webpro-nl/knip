import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/configuration-hints');

test('Provide configuration hints', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.files.has(join(cwd, 'src/entry.js')));

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'entry-top-level', identifier: '[src/entry.js]' },
      { type: 'project-top-level', identifier: '[src/**]' },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 2,
    total: 2,
  });
});

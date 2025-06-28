import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { join, resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/configuration-hints');

test('Provide configuration hints', async () => {
  const { issues, counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

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

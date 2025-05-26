import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/configuration-hints2');

test('Provide configuration hints (2)', async () => {
  const { counters, configurationHints } = await main({
    ...baseArguments,
    cwd,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'entry-top-level', identifier: '[src/entry.js, …]' },
      { type: 'project-top-level', identifier: '[src/**]' },
      { type: 'project', identifier: 'lib/**', workspaceName: '.' },
      { type: 'entry', identifier: 'lib/index.js', workspaceName: '.' },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

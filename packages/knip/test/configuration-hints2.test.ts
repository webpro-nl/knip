import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/configuration-hints2');

test('Provide configuration hints (2)', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'entry-top-level', identifier: '[src/entry.js, …]' },
      { type: 'project-top-level', identifier: '[src/**]' },
      { type: 'project-empty', identifier: 'lib/**', workspaceName: '.' },
      { type: 'entry-empty', identifier: 'lib/index.js', workspaceName: '.' },
    ])
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

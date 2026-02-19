import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/configuration-hints2');

test('Provide configuration hints (2)', async () => {
  const options = await createOptions({ cwd });
  const { counters, configurationHints } = await main(options);

  assert.deepEqual(configurationHints, [
    { type: 'entry-empty', identifier: 'lib/index.js', workspaceName: '.' },
    { type: 'project-empty', identifier: 'lib/**', workspaceName: '.' },
    { type: 'entry-top-level', identifier: '[src/entry.js, …]' },
    { type: 'project-top-level', identifier: '[src/**]' },
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

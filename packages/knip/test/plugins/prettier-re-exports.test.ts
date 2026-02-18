import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/prettier-reexport');

test('Handle re-exported config', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(!issues.unlisted?.['prettier.config.js']?.['prettier-plugin-test']);

  assert.deepEqual(
    configurationHints.filter(hint => hint.type === 'ignoreDependencies'),
    [{ type: 'ignoreDependencies', workspaceName: '.', identifier: 'prettier-plugin-test' }]
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

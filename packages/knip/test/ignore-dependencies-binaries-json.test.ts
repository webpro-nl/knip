import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/ignore-dependencies-binaries-json');

test('Respect ignored binaries and dependencies, including string-to-regex, config hints', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert(issues.binaries['package.json']['formatter']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 1,
    processed: 1,
    total: 1,
  });

  assert.deepEqual(
    configurationHints,
    new Set([
      { type: 'ignoreBinaries', workspaceName: '.', identifier: /.*unused-bins.*/ },
      { type: 'ignoreDependencies', workspaceName: '.', identifier: 'stream' },
      { type: 'ignoreDependencies', workspaceName: '.', identifier: /.+unused-deps.+/ },
    ])
  );
});

test('Respect ignored binaries and dependencies, including string-to-regex', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

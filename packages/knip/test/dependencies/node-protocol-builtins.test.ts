import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/node-protocol-builtins');

test('Treat any `node:` specifier as a built-in, never an unlisted dependency', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  const unlisted = issues.unlisted['index.ts'] ?? {};
  assert(unlisted['unlisted-package']);
  assert(!Object.keys(unlisted).some(name => name.startsWith('node:')));

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});

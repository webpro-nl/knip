import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/cloudflare-protocol-builtins');

test('Treat cloudflare: specifiers as runtime built-ins, but not the cloudflare package', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.dependencies, {});

  const unlisted = issues.unlisted['index.ts'] ?? {};
  assert.deepEqual(Object.keys(unlisted), ['cloudflare']);
  assert.equal(unlisted['cloudflare'].line, 4);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 1,
    total: 1,
  });
});

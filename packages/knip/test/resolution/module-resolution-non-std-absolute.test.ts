import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/module-resolution-non-std-absolute');

test('Resolve non-standard absolute specifiers', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.unlisted['x-self/index.ts']?.['x-other']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Resolve non-standard absolute specifiers (strict flags sibling workspace)', async () => {
  const options = await createOptions({ cwd, isStrict: true, isProduction: false });
  const { issues } = await main(options);

  assert(issues.unlisted['x-self/index.ts']['x-other']);
});

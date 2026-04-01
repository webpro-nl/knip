import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/storybook3');

test('Find dependencies with the Storybook plugin (vitest addon + coverage)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.devDependencies['package.json']?.['@vitest/coverage-v8']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 0,
    processed: 2,
    total: 2,
  });
});

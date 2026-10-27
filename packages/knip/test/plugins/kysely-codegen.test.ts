import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the kysely-codegen plugin', async () => {
  const cwd = resolve('fixtures/plugins/kysely-codegen');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['.kysely-codegenrc.mjs', 'src/generated.ts']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 4,
    total: 4,
  });
});

test('Find dependencies in kysely-codegen .config and custom config files', async () => {
  const cwd = resolve('fixtures/plugins/kysely-codegen2');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

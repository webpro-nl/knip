import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/prettier');

test('Find dependencies with the Prettier plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['.prettierrc']['prettier-plugin-xml']);
  assert(issues.unresolved['package.json']['@company/prettier-config']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    unresolved: 1,
    processed: 0,
    total: 0,
  });
});

test('Find dependencies with the Prettier plugin (.json5 config)', async () => {
  const cwd = resolve('fixtures/plugins/prettier-json5');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['prettier']);
  assert(issues.unlisted['.prettierrc.json5']['prettier-plugin-tailwindcss']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});

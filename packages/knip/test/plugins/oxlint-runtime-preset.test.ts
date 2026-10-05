import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Filter external lint preset dependencies without filtering Vitest coverage', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/oxlint-runtime-preset') });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.unlisted['vite.config.ts']).sort(), [
    '@vitest/coverage-v8',
    'eslint-plugin-missing',
  ]);
  assert.equal(counters.unlisted, 2);
  assert.deepEqual(Object.values(issues.devDependencies).flatMap(Object.keys), []);
});

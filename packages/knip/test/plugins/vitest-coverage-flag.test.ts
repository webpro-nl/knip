import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/vitest-coverage-flag');

test('Find the coverage provider from the bare --coverage flag', async () => {
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.unlisted['package.json']['@vitest/coverage-v8']);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Use the default v8 provider for a bare --coverage flag, not a stray listed provider', async () => {
  const cwd = resolve('fixtures/plugins/vitest-coverage-flag');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.devDependencies['package.json']?.['@vitest/coverage-v8']);
  assert(!issues.unlisted['package.json']?.['@vitest/coverage-v8']);
  assert(issues.devDependencies['package.json']['@vitest/coverage-istanbul']);
});

test('Do not assume v8 when another provider is configured (--coverage)', async () => {
  const cwd = resolve('fixtures/plugins/vitest-coverage-flag-istanbul');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.unlisted['package.json']?.['@vitest/coverage-v8']);
  assert(!issues.devDependencies['package.json']?.['@vitest/coverage-istanbul']);
});

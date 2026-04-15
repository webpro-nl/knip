import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('Optional peerDependencies in strict mode should not be reported as unused dependencies', async () => {
  const cwd = resolve('fixtures/peer-dependencies-optional-strict');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['package.json']?.['pg']);
  assert(!issues.dependencies['package.json']?.['@types/pg']);
  assert(issues.dependencies['package.json']['required-peer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Unreferenced optional peerDependencies in strict mode should not be reported as unused dependencies', async () => {
  const cwd = resolve('fixtures/peer-dependencies-optional-strict-unreferenced');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['package.json']?.['optional-peer']);
  assert(!issues.optionalPeerDependencies['package.json']?.['optional-peer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

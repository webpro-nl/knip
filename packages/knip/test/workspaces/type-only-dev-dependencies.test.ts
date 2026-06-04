import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces/type-only-dev-dependencies');

test('Type-only workspace dependencies are not flagged in default mode', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Type-only workspace dependencies are not flagged in production mode', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Type-only workspace devDependencies should not be considered unlisted in strict mode', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(!issues.unlisted['packages/app/index.ts']?.['@fixtures/workspaces-type-only-dev-dependencies__types']);
  assert(!issues.unlisted['packages/app/index.ts']?.['@fixtures/workspaces-type-only-dev-dependencies__prod-types']);
  assert(issues.unlisted['packages/app/index.ts']['@fixtures/workspaces-type-only-dev-dependencies__runtime']);

  assert(
    !issues.dependencies['packages/app/package.json']?.['@fixtures/workspaces-type-only-dev-dependencies__prod-types']
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 4,
    total: 4,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find MikroORM entities, migrations and default seeders in production', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/mikro-orm'), isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['unreferenced.ts']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 15,
    total: 15,
  });
});

test('Resolve package.json configPaths and await its configuration factory', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/mikro-orm-config-paths'), isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['src/config-paths/other-context/Entity.ts', 'unreferenced.ts']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 3,
    total: 3,
  });
});

test('Resolve MikroORM configuration factory members in arrays', async () => {
  const options = await createOptions({ cwd: resolve('fixtures/plugins/mikro-orm-array-factory'), isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['src/other-context/Entity.ts', 'unreferenced.ts']);
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 3,
    total: 3,
  });
});

test('Ignore package.json MikroORM options without configPaths', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/mikro-orm-package-section'),
    isProduction: true,
  });
  const { issues } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['migrations/Stale.ts']);
});

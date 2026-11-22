import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies and literal route entries with the react-router plugin', async () => {
  const cwd = resolve('fixtures/plugins/react-router');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['app/routes/sitemap.xml.tsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 12,
    total: 12,
  });
});

test('Find dependencies with the react-router plugin [with absolute paths]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-with-absolute-paths');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 6,
    total: 6,
  });
});

test('Find dependencies with the react-router plugin [with custom server entry]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-with-server-entry');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

test('Find dependencies with the react-router plugin [with .mts and .mjs entries]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-mts');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/routes/unused.mts' in issues.files);

  assert(issues.dependencies['package.json']['@react-router/node']);
  assert(issues.dependencies['package.json']['isbot']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
    files: 1,
    processed: 6,
    total: 6,
  });
});

test('Find dependencies with the react-router plugin [with .jsx config and routes]', async () => {
  const cwd = resolve('fixtures/plugins/react-router-jsx');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('app/routes/unused.jsx' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 1,
    processed: 5,
    total: 5,
  });
});

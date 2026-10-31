import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find entries with the @solidjs/vite-plugin plugin (start options in SSR mode)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'env.ts',
    'src/App.tsx',
    'src/Document.tsx',
    'src/entry-client.tsx',
    'src/entry-server.tsx',
    'src/root.tsx',
    'src/setup.ts',
    'src/shell.tsx',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 8,
    processed: 14,
    total: 14,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (production)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin');
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'env.ts',
    'src/App.tsx',
    'src/Document.tsx',
    'src/entry-client.tsx',
    'src/entry-server.tsx',
    'src/root.tsx',
    'src/setup.ts',
    'src/shell.tsx',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 8,
    processed: 13,
    total: 13,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (production with entry override)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin');
  const options = await createOptions({ cwd, isProduction: true });
  options.parsedConfig['solidjs-vite-plugin'] = { entry: ['src/App.tsx'] };
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'env.ts',
    'src/Document.tsx',
    'src/entry-client.tsx',
    'src/entry-server.tsx',
    'src/root.tsx',
    'src/setup.ts',
    'src/shell.tsx',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 7,
    processed: 13,
    total: 13,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (setup with generated entries)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin-generated');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), []);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    processed: 3,
    total: 3,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (setup with generated entries in production)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin-generated');
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), []);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 0,
    processed: 2,
    total: 2,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (custom root in client mode)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin-root');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'app/src/App.tsx',
    'app/src/entry-server.tsx',
    'src/entry-server.tsx',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 7,
    total: 7,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (no start)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin-spa');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['env.ts', 'src/entry-server.tsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 5,
    total: 5,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (no start in production)', async () => {
  const cwd = resolve('fixtures/plugins/solidjs-vite-plugin-spa');
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['env.ts', 'src/entry-server.tsx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 4,
    total: 4,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/solidjs-vite-plugin');
const cwdEntries = resolve('fixtures/plugins/solidjs-vite-plugin-entries');
const cwdRoot = resolve('fixtures/plugins/solidjs-vite-plugin-root');
const cwdClient = resolve('fixtures/plugins/solidjs-vite-plugin-client');
const cwdSpread = resolve('fixtures/plugins/solidjs-vite-plugin-spread');
const cwdSpa = resolve('fixtures/plugins/solidjs-vite-plugin-spa');

test('Find entries with the @solidjs/vite-plugin plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/Document.tsrx' in issues.files);
  assert('env.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 9,
    total: 9,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 8,
    total: 8,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (lazy plugin modules, authored entries)', async () => {
  const options = await createOptions({ cwd: cwdEntries });
  const { issues, counters } = await main(options);

  assert('src/entry-server.tsx' in issues.files);
  assert('src/entry-client.tsx' in issues.files);
  assert('src/App.tsx' in issues.files);
  assert('src/Document.tsx' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 12,
    total: 12,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (lazy plugin modules, authored entries, production)', async () => {
  const options = await createOptions({ cwd: cwdEntries, isProduction: true });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 11,
    total: 11,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (start: true, custom root, conventional entries)', async () => {
  const options = await createOptions({ cwd: cwdRoot });
  const { issues, counters } = await main(options);

  assert('app/src/App.tsx' in issues.files);
  assert('app/src/Document.tsrx' in issues.files);
  assert('src/App.tsx' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 7,
    total: 7,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (client mode)', async () => {
  const options = await createOptions({ cwd: cwdClient });
  const { issues, counters } = await main(options);

  assert('src/entry-server.tsx' in issues.files);
  assert('src/App.tsx' in issues.files);
  assert('src/setup.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 6,
    total: 6,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (spread may override ssr)', async () => {
  const options = await createOptions({ cwd: cwdSpread });
  const { issues, counters } = await main(options);

  assert(!('src/Document.tsx' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 4,
    total: 4,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (no start mode)', async () => {
  const options = await createOptions({ cwd: cwdSpa });
  const { issues, counters } = await main(options);

  assert('src/entry-server.tsx' in issues.files);
  assert('env.ts' in issues.files);
  assert(issues.exports['src/App.tsx']['unusedHelper']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    exports: 1,
    processed: 5,
    total: 5,
  });
});

test('Find entries with the @solidjs/vite-plugin plugin (no Vite config found)', async () => {
  const options = await createOptions({ cwd: cwdSpa, args: { config: 'knip.no-vite-config.json' } });
  const { issues, counters } = await main(options);

  assert('src/entry-server.tsx' in issues.files);
  assert('env.ts' in issues.files);
  assert(issues.exports['src/App.tsx']['unusedHelper']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    exports: 1,
    processed: 5,
    total: 5,
  });
});

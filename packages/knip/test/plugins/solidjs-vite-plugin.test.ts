import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cases = [
  { name: 'start options', fixture: '', unused: ['env.ts', 'src/App.tsx', 'src/Document.tsx'], processed: 11 },
  {
    name: 'production',
    fixture: '',
    isProduction: true,
    unused: ['env.ts', 'src/App.tsx', 'src/Document.tsx'],
    processed: 10,
  },
  {
    name: 'custom root, authored entries',
    fixture: '-root',
    unused: ['app/src/App.tsx', 'app/src/Document.tsrx', 'src/entry-server.tsx'],
    processed: 7,
  },
  {
    name: 'lazy plugin',
    fixture: '-entries',
    unused: ['src/App.tsx', 'src/Document.tsx', 'src/entry-client.tsx', 'src/entry-server.tsx'],
    processed: 11,
  },
  {
    name: 'client mode',
    fixture: '-client',
    unused: ['src/App.tsx', 'src/entry-server.tsx', 'src/setup.ts'],
    processed: 6,
  },
  { name: 'spread may override ssr', fixture: '-spread', unused: [], processed: 4 },
  { name: 'start: true', fixture: '-app', unused: [], processed: 3 },
  { name: 'no start', fixture: '-spa', unused: ['env.ts', 'src/entry-server.tsx'], exports: 1, processed: 5 },
  {
    name: 'no Vite config',
    fixture: '-spa',
    config: 'knip.no-vite-config.json',
    unused: ['env.ts', 'src/entry-server.tsx', 'vite.config.ts'],
    exports: 1,
    devDependencies: 1,
    processed: 5,
  },
];

for (const { name, fixture, isProduction = false, config, unused, processed, ...issueCounts } of cases) {
  test(`Find entries with the @solidjs/vite-plugin plugin (${name})`, async () => {
    const cwd = resolve(`fixtures/plugins/solidjs-vite-plugin${fixture}`);
    const options = await createOptions({ cwd, isProduction, args: { config } });
    const { issues, counters } = await main(options);

    assert.deepEqual(Object.keys(issues.files).sort(), unused);
    assert.deepEqual(counters, {
      ...baseCounters,
      ...issueCounts,
      files: unused.length,
      processed,
      total: processed,
    });
  });
}

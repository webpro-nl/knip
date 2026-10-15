import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cases = [
  {
    name: 'start options in SSR mode',
    fixture: '',
    unused: [
      'env.ts',
      'src/App.tsx',
      'src/Document.tsx',
      'src/entry-client.tsx',
      'src/entry-server.tsx',
      'src/root.tsx',
      'src/setup.ts',
      'src/shell.tsx',
    ],
    processed: 14,
  },
  {
    name: 'production',
    fixture: '',
    isProduction: true,
    unused: [
      'env.ts',
      'src/App.tsx',
      'src/Document.tsx',
      'src/entry-client.tsx',
      'src/entry-server.tsx',
      'src/root.tsx',
      'src/setup.ts',
      'src/shell.tsx',
    ],
    processed: 13,
  },
  {
    name: 'production with entry override',
    fixture: '',
    isProduction: true,
    entry: ['src/App.tsx'],
    unused: [
      'env.ts',
      'src/Document.tsx',
      'src/entry-client.tsx',
      'src/entry-server.tsx',
      'src/root.tsx',
      'src/setup.ts',
      'src/shell.tsx',
    ],
    processed: 13,
  },
  { name: 'setup with generated entries', fixture: '-generated', unused: [], processed: 3 },
  {
    name: 'setup with generated entries in production',
    fixture: '-generated',
    isProduction: true,
    unused: [],
    processed: 2,
  },
  {
    name: 'custom root in client mode',
    fixture: '-root',
    unused: ['app/src/App.tsx', 'app/src/entry-server.tsx', 'src/entry-server.tsx'],
    processed: 7,
  },
  { name: 'no start', fixture: '-spa', unused: ['env.ts', 'src/entry-server.tsx'], processed: 5 },
  {
    name: 'no start in production',
    fixture: '-spa',
    isProduction: true,
    unused: ['env.ts', 'src/entry-server.tsx'],
    processed: 4,
  },
];

for (const { name, fixture, isProduction = false, entry, unused, processed } of cases) {
  test(`Find entries with the @solidjs/vite-plugin plugin (${name})`, async () => {
    const cwd = resolve(`fixtures/plugins/solidjs-vite-plugin${fixture}`);
    const options = await createOptions({ cwd, isProduction });
    if (entry) options.parsedConfig['solidjs-vite-plugin'] = { entry };
    const { issues, counters } = await main(options);

    assert.deepEqual(Object.keys(issues.files).sort(), unused);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: unused.length,
      processed,
      total: processed,
    });
  });
}

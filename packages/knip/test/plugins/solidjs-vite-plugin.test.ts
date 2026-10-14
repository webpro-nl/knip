import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cases = [
  {
    name: 'start options',
    fixture: '',
    unused: ['env.ts', 'src/App.tsx', 'src/Document.tsx', 'src/entry-client.tsx', 'src/entry-server.tsx'],
    processed: 15,
  },
  {
    name: 'production',
    fixture: '',
    isProduction: true,
    unused: ['env.ts', 'src/App.tsx', 'src/Document.tsx', 'src/entry-client.tsx', 'src/entry-server.tsx'],
    processed: 14,
  },
  { name: 'custom root', fixture: '-root', unused: ['src/entry-server.tsx'], processed: 7 },
  { name: 'lazy plugin', fixture: '-lazy', unused: ['src/entry-client.tsx'], processed: 11 },
  { name: 'no start', fixture: '-spa', unused: ['env.ts', 'src/entry-server.tsx'], processed: 6 },
];

for (const { name, fixture, isProduction = false, unused, processed } of cases) {
  test(`Find entries with the @solidjs/vite-plugin plugin (${name})`, async () => {
    const cwd = resolve(`fixtures/plugins/solidjs-vite-plugin${fixture}`);
    const options = await createOptions({ cwd, isProduction });
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

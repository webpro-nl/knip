import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/worker-path-join');

test('Resolve inline path.join(__dirname, ...) in Worker and child_process calls', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert('workers/bound.js' in issues.files);
  assert('scripts/bare.js' in issues.files);
  assert('workers/not-dirname.js' in issues.files);
  assert('workers/dynamic.js' in issues.files);
  assert('workers/aliased-worker-class.js' in issues.files);
  assert('scripts/aliased-path-helper.js' in issues.files);
  assert.equal(Object.keys(issues.files).length, 6);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 6,
    processed: 14,
    total: 14,
  });
});

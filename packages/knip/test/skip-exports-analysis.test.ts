import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/skip-exports-analysis');

test('ignore exports', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['package.json'].nodemon);
  assert(issues.binaries['package.json'].playwright);

  assert(issues.exports['src/used.js'].default);
  assert(issues.exports['src/used.js'].unused);
  assert(issues.exports['lib/used.js'].default);
  assert(issues.exports['lib/used.js'].unused);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 4,
    binaries: 2,
    processed: 7,
    total: 7,
  });
});

test('ignore exports (isIncludeEntryExports)', async () => {
  const options = await createOptions({ cwd, isIncludeEntryExports: true });
  const { issues, counters } = await main(options);
  assert(issues.binaries['package.json'].nodemon);
  assert(issues.binaries['package.json'].playwright);

  assert(issues.exports['src/index.js'].reexport);

  assert(issues.exports['src/used.js'].default);
  assert(issues.exports['src/used.js'].unused);
  assert(issues.exports['src/used.js'].reexport);

  assert(issues.exports['lib/used.js'].default);
  assert(issues.exports['lib/used.js'].unused);
  assert(issues.exports['lib/used.js'].reexport);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 7,
    binaries: 2,
    processed: 7,
    total: 7,
  });
});

test('ignore exports (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/used.js'].unused);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3, // TODO: cancel out like regular dev entries
    exports: 2,
    processed: 5,
    total: 5,
  });
});

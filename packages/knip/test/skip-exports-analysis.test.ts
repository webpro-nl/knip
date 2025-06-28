import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const cwd = resolve('fixtures/skip-exports-analysis');

test('Skip exports analysis', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

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

test('Skip exports analysis (isIncludeEntryExports)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isIncludeEntryExports: true,
  });

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

test('Skip exports analysis (production)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
  });

  assert(issues.exports['src/used.js'].default);
  assert(issues.exports['src/used.js'].unused);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3, // TODO: cancel out like regular dev entries
    exports: 2,
    processed: 5,
    total: 5,
  });
});

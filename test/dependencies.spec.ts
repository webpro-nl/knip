import test from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';
import baseCounters from './fixtures/baseCounters.js';

test('Find unused dependencies', async () => {
  const workingDir = 'test/fixtures/dependencies';

  const { issues, counters } = await main({
    ...baseArguments,
    cwd: workingDir,
    workingDir,
  });

  assert(Array.from(issues.files)[0].endsWith('unused.ts'));
  assert.equal(Object.keys(issues.dependencies['package.json']).length, 3);
  assert(issues.dependencies['package.json']['@tootallnate/once']);
  assert(issues.dependencies['package.json']['jquery']);
  assert(issues.dependencies['package.json']['fs-extra']);
  assert(!issues.dependencies['package.json']['mocha']);

  assert.equal(Object.keys(issues.unlisted).length, 2);
  assert(issues.unlisted['dep.ts']['ansi-regex']);
  assert(issues.unlisted['entry.ts']['not-exist']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 3,
    unlisted: 3,
    processed: 3,
    total: 3,
  });
});

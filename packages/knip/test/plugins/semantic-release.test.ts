import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/semantic-release');

test('Find dependencies with the semantic-release plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['semantic-release']);

  assert(issues.unresolved['.releaserc']['@semantic-release/commit-analyzer']);
  assert(issues.unresolved['.releaserc']['@semantic-release/release-notes-generator']);
  assert(issues.unresolved['.releaserc']['@semantic-release/changelog']);
  assert(issues.unresolved['.releaserc']['@semantic-release/git']);
  assert(issues.unresolved['.releaserc']['@semantic-release/npm']);
  assert(issues.unresolved['.releaserc']['@semantic-release/github']);

  assert(issues.unresolved['package.json']['@semantic-release/commit-analyzer']);
  assert(issues.unresolved['package.json']['@semantic-release/release-notes-generator']);
  assert(issues.unresolved['package.json']['@semantic-release/changelog']);
  assert(issues.unresolved['package.json']['@semantic-release/git']);
  assert(issues.unresolved['package.json']['@semantic-release/npm']);
  assert(issues.unresolved['package.json']['@semantic-release/github']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unresolved: 12,
    processed: 0,
    total: 0,
  });
});

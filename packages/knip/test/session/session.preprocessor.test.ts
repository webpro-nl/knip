import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import type { Issues } from '../../src/types/issues.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/session-preprocessor');
const mutationCwd = resolve('fixtures/session-preprocessor-mutation');

const getUnusedFilePaths = (issues: Issues) =>
  Object.values(issues.files).flatMap(issue => Object.values(issue).map(i => i.filePath));

test('session does not run preprocessors when they are not configured', async () => {
  const options = await createOptions({ cwd, isSession: true, args: { preprocessor: [] } });
  const session = await createSession(options);
  const results = session.getResults();

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), [join(cwd, 'unused.ts')]);
  assert.strictEqual(session.getResults(), results);
});

test('session runs configured preprocessors for issues and results', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const results = session.getResults();

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), []);
  assert.deepEqual(getUnusedFilePaths(results.issues), []);
  assert.equal(results.counters.total, 1);
  assert.strictEqual(session.getIssues(), results);
  assert.deepEqual(Object.keys(results).sort(), [
    'configurationHints',
    'counters',
    'enabledPlugins',
    'includedWorkspaceDirs',
    'issues',
    'selectedWorkspaces',
    'tagHints',
  ]);

  const update = await session.handleFileChanges([{ type: 'modified', filePath: join(cwd, '.git', 'ignored.ts') }]);

  assert.equal(update, undefined);
  assert.strictEqual(session.getResults(), results);
  assert.equal(results.counters.total, 1);

  const filePath = join(cwd, 'index.ts');
  const source = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, `${source}\n`);
  try {
    const update = await session.handleFileChanges([{ type: 'modified', filePath }]);
    assert.ok(update);
    const updatedResults = session.getResults();
    assert.strictEqual(updatedResults, results);
    assert.strictEqual(session.getIssues(), updatedResults);
    assert.deepEqual(getUnusedFilePaths(updatedResults.issues), []);
    assert.equal(updatedResults.counters.total, 2);
  } finally {
    writeFileSync(filePath, source);
  }
});

test('session preprocessors do not mutate collector state', async () => {
  const options = await createOptions({ cwd: mutationCwd, isSession: true });
  const session = await createSession(options);

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), []);

  const filePath = join(mutationCwd, 'index.ts');
  const source = readFileSync(filePath, 'utf8');
  writeFileSync(filePath, `${source}\n`);
  try {
    const update = await session.handleFileChanges([{ type: 'modified', filePath }]);
    assert.ok(update);
    assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), [join(mutationCwd, 'unused.ts')]);
  } finally {
    writeFileSync(filePath, source);
  }
});

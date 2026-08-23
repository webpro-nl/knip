import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import type { Issues } from '../../src/types/issues.ts';
import { join } from '../../src/util/path.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/session-preprocessor');

const getUnusedFilePaths = (issues: Issues) =>
  Object.values(issues.files).flatMap(issue => Object.values(issue).map(i => i.filePath));

test('session does not run preprocessors when they are not configured', async () => {
  const options = await createOptions({ cwd, isSession: true, args: { preprocessor: [] } });
  const session = await createSession(options);

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), [join(cwd, 'unused.ts')]);
});

test('session runs configured preprocessors for issues and results', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), []);
  assert.deepEqual(getUnusedFilePaths(session.getResults().issues), []);

  await session.handleFileChanges([{ type: 'modified', filePath: join(cwd, 'unused.ts') }]);

  assert.deepEqual(getUnusedFilePaths(session.getIssues().issues), []);
  assert.deepEqual(getUnusedFilePaths(session.getResults().issues), []);
});

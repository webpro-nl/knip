import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import type { Issues } from '../../src/types/issues.ts';
import { join, toPosix } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const skipIfBun = typeof Bun !== 'undefined' ? test.skip : test;

const fixtureCwd = resolve('fixtures/session/preprocessor');
const getSession = async (cwd: string, config: string, preprocessor?: string[]) =>
  createSession(await createOptions({ cwd, isSession: true, args: { config, preprocessor } }));
const getFileIssues = (issues: Issues) => Object.values(issues.files).flatMap(records => Object.values(records));

test('applies config preprocessors to initial session issues and results', async () => {
  const rawSession = await getSession(fixtureCwd, 'knip-initial.json', []);
  assert.equal(getFileIssues(rawSession.getIssues().issues).length, 1);

  const session = await getSession(fixtureCwd, 'knip-initial.json');
  assert.equal(getFileIssues(session.getIssues().issues).length, 0);
  assert.equal(getFileIssues(session.getResults().issues).length, 0);
});

test('reapplies the config preprocessor after a session refresh', async () => {
  const cwd = toPosix(await copyFixture('fixtures/session/preprocessor'));
  const session = await getSession(cwd, 'knip-refresh.json');
  const addedFilePath = join(cwd, 'added-module.ts');
  writeFileSync(addedFilePath, 'export const addedValue = 1;');

  await session.handleFileChanges([{ type: 'added', filePath: addedFilePath }]);

  const addedIssue = getFileIssues(session.getIssues().issues).find(issue => issue.filePath === addedFilePath);
  assert.equal(addedIssue?.symbol, 'processed:added-module.ts');
  const resultIssue = getFileIssues(session.getResults().issues).find(issue => issue.filePath === addedFilePath);
  assert.equal(resultIssue?.symbol, 'processed:added-module.ts');
});

skipIfBun('fails open and surfaces config preprocessor loader errors in a session', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const session = await getSession(fixtureCwd, 'knip-load-error.json');

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /Error loading .*missing-preprocessor\.js/);
});

skipIfBun('fails open to untransformed issues and surfaces throwing preprocessors in a session', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const session = await getSession(fixtureCwd, 'knip-throw-error.json');

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /session preprocessor exploded/);
});

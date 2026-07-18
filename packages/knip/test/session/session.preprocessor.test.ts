import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { createSession } from '../../src/session/session.ts';
import type { Issues } from '../../src/types/issues.ts';
import { join } from '../../src/util/path.ts';
import { copyFixture } from '../helpers/copy-fixture.ts';
import { createOptions } from '../helpers/create-options.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const getFileIssues = (issues: Issues) => Object.values(issues.files).flatMap(records => Object.values(records));

const getIssueCount = (issues: Issues) =>
  Object.values(issues).reduce(
    (count, records) =>
      count + Object.values(records).reduce((sum, issuesForFile) => sum + Object.keys(issuesForFile).length, 0),
    0
  );

test('applies config preprocessors to initial session issues and results', async () => {
  const cwd = resolve('fixtures/session/preprocessor-initial');
  const rawOptions = await createOptions({ cwd, isSession: true, args: { preprocessor: [] } });
  const rawSession = await createSession(rawOptions);
  assert.equal(getFileIssues(rawSession.getIssues().issues).length, 1);

  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.equal(getFileIssues(session.getIssues().issues).length, 0);
  assert.equal(getFileIssues(session.getResults().issues).length, 0);
});

test('returns the same config-preprocessed issues through the CLI and session', async () => {
  const cwd = resolve('fixtures/session/preprocessor-parity');
  const cli = exec('knip --reporter json', { cwd });
  assert.equal(cli.status, 0);
  assert.deepEqual(JSON.parse(cli.stdout), { issues: [] });

  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  assert.equal(getIssueCount(session.getIssues().issues), 0);
  assert.equal(getIssueCount(session.getResults().issues), 0);
});

test('reapplies the config preprocessor after a session refresh', async () => {
  const cwd = await copyFixture('fixtures/session/preprocessor-refresh');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const addedFilePath = join(cwd, 'added-module.ts');
  writeFileSync(addedFilePath, 'export const addedValue = 1;');

  await session.handleFileChanges([{ type: 'added', filePath: addedFilePath }]);

  const addedIssue = getFileIssues(session.getIssues().issues).find(issue => issue.filePath === addedFilePath);
  assert.equal(addedIssue?.symbol, 'processed:added-module.ts');
  const resultIssue = getFileIssues(session.getResults().issues).find(issue => issue.filePath === addedFilePath);
  assert.equal(resultIssue?.symbol, 'processed:added-module.ts');
});

test('recreates config preprocessors when a restarted session reads changed config', async () => {
  const cwd = await copyFixture('fixtures/session/preprocessor-config-restart');
  const firstOptions = await createOptions({ cwd, isSession: true });
  const firstSession = await createSession(firstOptions);
  assert.equal(getFileIssues(firstSession.getIssues().issues)[0]?.symbol, 'first:unused-module.ts');

  writeFileSync(
    join(cwd, 'knip.json'),
    JSON.stringify({ entry: 'index.ts', project: ['*.ts'], preprocessor: './second-preprocessor.js' })
  );

  const secondOptions = await createOptions({ cwd, isSession: true });
  const secondSession = await createSession(secondOptions);
  assert.equal(getFileIssues(secondSession.getIssues().issues)[0]?.symbol, 'second:unused-module.ts');
});

test('keeps deep preprocessor mutations out of live collector state on refresh', async () => {
  const cwd = await copyFixture('fixtures/session/preprocessor-copy-boundary');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);
  const sourceFilePath = join(cwd, 'unused-module.ts');

  assert.ok(session.getResults().configurationHints.some(hint => hint.identifier === 'collector-clean'));
  assert.ok(!session.getResults().configurationHints.some(hint => hint.identifier === 'collector-corrupted'));

  writeFileSync(sourceFilePath, 'export const refreshedValue = 2;');
  await session.handleFileChanges([{ type: 'modified', filePath: sourceFilePath }]);

  assert.ok(session.getResults().configurationHints.some(hint => hint.identifier === 'collector-clean'));
  assert.ok(!session.getResults().configurationHints.some(hint => hint.identifier === 'collector-corrupted'));
});

test('fails open and surfaces config preprocessor loader errors in a session', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const cwd = resolve('fixtures/session/preprocessor-load-error');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /Error loading .*missing-preprocessor\.js/);
});

test('fails open to untransformed issues and surfaces throwing preprocessors in a session', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const cwd = resolve('fixtures/session/preprocessor-throw-error');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /session preprocessor exploded/);
});

test('fails open when a session preprocessor returns undefined', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const cwd = resolve('fixtures/session/preprocessor-undefined-return');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.equal(getFileIssues(session.getResults().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /Preprocessor contract violation/);
});

test('fails open when a session preprocessor omits issues from its result', async t => {
  const errors: string[] = [];
  t.mock.method(console, 'error', (...values: unknown[]) => errors.push(values.map(String).join(' ')));
  const cwd = resolve('fixtures/session/preprocessor-shape-drop');
  const options = await createOptions({ cwd, isSession: true });
  const session = await createSession(options);

  assert.equal(getFileIssues(session.getIssues().issues)[0]?.symbol, 'unused-module.ts');
  assert.equal(getFileIssues(session.getResults().issues)[0]?.symbol, 'unused-module.ts');
  assert.match(errors.join('\n'), /Preprocessor contract violation/);
});

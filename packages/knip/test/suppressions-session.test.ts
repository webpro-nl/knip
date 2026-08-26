import assert from 'node:assert/strict';
import test from 'node:test';
import { createSession } from '../src/session/session.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/suppressions');

// The fixture ships a suppressions file that covers every issue it produces.
test('Session applies suppressions, like the CLI does', async () => {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false });
  const { issues, counters } = (await createSession(options)).getResults();

  assert.deepEqual(Object.keys(issues.exports), []);
  assert.deepEqual(Object.keys(issues.files), []);
  assert.deepEqual(Object.keys(issues.dependencies), []);
  assert.equal(counters.exports, 0);
  assert.equal(counters.files, 0);
  assert.equal(counters.dependencies, 0);
});

test('Session hands back suppressed issues separately, so debt stays visible', async () => {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false });
  const { suppressedIssues, suppressedCount } = (await createSession(options)).getResults();

  assert.equal(suppressedCount, 5);
  assert(suppressedIssues.exports['module.ts']['unusedExport']);
  assert(suppressedIssues.exports['module.ts']['anotherUnused']);
  assert(suppressedIssues.files['unused.ts']['unused.ts']);
  assert(suppressedIssues.dependencies['package.json']['unused-pkg']);
  assert(suppressedIssues.dependencies['package.json']['used-pkg']);
});

test('Suppressed issues keep their position, so an editor can render them', async () => {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false });
  const { suppressedIssues } = (await createSession(options)).getResults();

  const issue = suppressedIssues.exports['module.ts']['unusedExport'];
  assert.equal(issue.symbol, 'unusedExport');
  assert.equal(issue.type, 'exports');
  assert.equal(typeof issue.line, 'number');
  assert.equal(typeof issue.col, 'number');
});

test('--no-suppressions leaves the session report untouched', async () => {
  const options = await createOptions({ cwd, isSession: true, isUseTscFiles: false, noSuppressions: true });
  const { issues, suppressedCount } = (await createSession(options)).getResults();

  assert(issues.exports['module.ts']['unusedExport']);
  assert(issues.files['unused.ts']);
  assert.equal(suppressedCount, 0);
});

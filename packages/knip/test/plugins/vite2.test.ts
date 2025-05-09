import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';

const cwd = resolve('fixtures/plugins/vite');
const cwd2 = resolve('fixtures/plugins/vite2');

test('Find extension issues with incomplete config', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
  });

  assert.ok(issues.files.size > 0);

  const fileIssues = Array.from(issues.files).filter(
    issue => issue && (issue.includes('mock.ts') || issue.includes('mock.desktop.ts'))
  );

  assert.ok(fileIssues.length > 0, 'Should find issues with mock files');
});

test('Should find 0 issues with proper extensions config', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd: cwd2,
  });

  assert.strictEqual(issues.files.size, 0, 'Should find no issues with complete extension config');

  assert.ok(counters.processed > 0, 'Should process at least one file');
});

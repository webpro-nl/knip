import test from 'node:test';
import path from 'path';
import assert from 'node:assert/strict';
import { main } from '../src';
import baseArguments from './fixtures/baseArguments';

test('ignorePatterns', async () => {
  const cwd = path.resolve('test/fixtures/gitignore');
  const workingDir = path.join(cwd, 'packages/a');

  const { issues } = await main({
    ...baseArguments,
    cwd,
    workingDir,
    gitignore: true,
  });

  assert.equal(issues.files.size, 0);
});

test('ignorePatterns (disabled)', async () => {
  const cwd = path.resolve('test/fixtures/gitignore');
  const workingDir = path.join(cwd, 'packages/a');

  const { issues } = await main({
    cwd,
    workingDir,
    include: [],
    exclude: [],
    ignore: [],
    gitignore: false,
    isIncludeEntryFiles: false,
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
    debug: {
      isEnabled: false,
      level: 0,
    },
  });

  assert.equal(issues.files.size, 3);
});

import test from 'node:test';
import path from 'path';
import assert from 'node:assert/strict';
import { main } from '../src';

test('ignorePatterns', async () => {
  const cwd = path.resolve('test/fixtures/gitignore');
  const workingDir = path.join(cwd, 'packages/a');

  const { issues } = await main({
    cwd,
    workingDir,
    include: [],
    exclude: [],
    ignore: [],
    gitignore: true,
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
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
    isDev: false,
    isShowProgress: false,
    jsDoc: [],
  });

  assert.equal(issues.files.size, 3);
});

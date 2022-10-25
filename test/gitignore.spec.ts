import test from 'node:test';
import path from 'path';
import assert from 'node:assert/strict';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';

test('Obey gitignore', async () => {
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

test('Ignore gitignore', async () => {
  const cwd = path.resolve('test/fixtures/gitignore');
  const workingDir = path.join(cwd, 'packages/a');

  const { issues } = await main({
    ...baseArguments,
    cwd,
    workingDir,
    gitignore: false,
  });

  assert.equal(issues.files.size, 3);
});

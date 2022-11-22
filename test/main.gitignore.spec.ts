import assert from 'node:assert/strict';
import path from 'path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './fixtures/baseArguments.js';

const cwd = path.resolve('test/fixtures/gitignore');

test('Obey gitignore', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    gitignore: true,
  });

  assert.equal(issues.files.size, 0);
});

test('Ignore gitignore', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    gitignore: false,
  });

  assert.equal(issues.files.size, 3);
});

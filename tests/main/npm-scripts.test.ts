import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';

const cwd = resolve('tests/fixtures/npm-scripts');

test('Unused dependencies in npm scripts', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.dependencies['package.json']['express']);

  assert(issues.devDependencies['package.json']['unused']);
  assert(!issues.devDependencies['package.json']['eslint-v6']);
  assert(!issues.devDependencies['package.json']['eslint-v7']);
  assert(!issues.devDependencies['package.json']['eslint-v8']);

  assert(issues.unlisted['package.json']['nodemon']);
  assert(issues.unlisted['package.json']['dotenv']);
  assert(!issues.unlisted['package.json']['rm']);
  assert(!issues.unlisted['package.json']['bash']);
});

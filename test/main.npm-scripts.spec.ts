import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { main } from '../src/index.js';
import baseArguments from './helpers/baseArguments.js';

const cwd = path.resolve('test/fixtures/npm-scripts');

test('Unused dependencies in npm scripts', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    isStrict: false,
  });

  assert(!issues.devDependencies['package.json']['eslint']);
  assert(!issues.devDependencies['package.json']['eslint-v6']);
  assert(!issues.devDependencies['package.json']['eslint-v7']);
  assert(!issues.devDependencies['package.json']['eslint-v8']);
});

test('Unused dependencies in npm scripts (strict)', async () => {
  const { issues } = await main({
    ...baseArguments,
    cwd,
    isStrict: true,
  });

  assert(!issues.devDependencies['package.json']['eslint']);
  assert(issues.devDependencies['package.json']['eslint-v6']);
  assert(issues.devDependencies['package.json']['eslint-v7']);
  assert(issues.devDependencies['package.json']['eslint-v8']);
});

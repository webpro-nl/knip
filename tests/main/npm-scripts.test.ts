import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('tests/fixtures/npm-scripts');

test('Unused dependencies in npm scripts', async () => {
  const { issues, counters } = await main({
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

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    devDependencies: 1,
    unlisted: 2,
  });
});

test('Unused dependencies in npm scripts (strict)', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isProduction: true,
    isStrict: true,
  });

  assert(issues.dependencies['package.json']['express']);
  assert(issues.dependencies['package.json']['unused-peer-dep']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
  });
});

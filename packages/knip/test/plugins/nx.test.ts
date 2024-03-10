import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/nx');

test('Find dependencies with the Nx plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.devDependencies['package.json']['@nx/cypress']);
  assert(issues.devDependencies['package.json']['@nrwl/devkit']);
  assert(issues.devDependencies['package.json']['@nrwl/storybook']);
  assert(issues.devDependencies['package.json']['@nrwl/web']);
  assert(issues.devDependencies['package.json']['@nrwl/workspace']);
  assert(issues.unlisted['apps/b/project.json']['@js/cypress']);
  assert(issues.unlisted['libs/b/project.json']['nx']);
  assert(issues.binaries['package.json']['nx']);
  assert(issues.binaries['libs/b/project.json']['webpack']);
  assert(issues.binaries['libs/b/project.json']['compodoc']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 3,
    devDependencies: 5,
    unlisted: 2,
    processed: 0,
    total: 0,
  });
});

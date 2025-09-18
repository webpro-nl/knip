import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/nx');

test('Find dependencies with the Nx plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['@nx/cypress']);
  assert(issues.devDependencies['package.json']['@nrwl/devkit']);
  assert(issues.devDependencies['package.json']['@nrwl/storybook']);
  assert(issues.devDependencies['package.json']['@nrwl/web']);
  assert(issues.devDependencies['package.json']['@nrwl/workspace']);
  assert(issues.devDependencies['package.json']['rimraf']);

  assert(issues.unlisted['apps/b/project.json']['@js/cypress']);
  assert(issues.unlisted['libs/b/project.json']['nx']);

  assert(issues.binaries['package.json']['nx']);
  assert(issues.binaries['libs/b/project.json']['webpack']);
  assert(issues.binaries['libs/b/project.json']['compodoc']);
  assert(issues.binaries['libs/b/project.json']['biome']);

  assert.deepEqual(counters, {
    ...baseCounters,
    binaries: 5,
    devDependencies: 6,
    unlisted: 3,
    processed: 0,
    total: 0,
  });
});

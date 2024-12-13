import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { join, resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/moonrepo');

test('Find dependencies with the moonrepo plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.binaries['.moon/tasks.yml']['ls-lint']);
  assert(issues.binaries['.moon/tasks/typescript.yml']['tsc']);
  assert(issues.binaries['.moon/tasks/typescript.yml']['eslint']);
  assert(issues.binaries['moon.yml']['vite-node']);
  assert(issues.binaries['moon.yml']['vitest']);

  assert(issues.devDependencies['package.json']['@moonrepo/cli']);
  assert(issues.devDependencies['package.json']['vite-node']);
  assert(issues.devDependencies['package.json']['eslint']);
  assert(issues.devDependencies['libs/b/package.json']['vitest']);

  assert(issues.files.has(join(cwd, 'libs/b/server/server.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 4,
    binaries: 5,
    processed: 2,
    total: 2,
  });
});

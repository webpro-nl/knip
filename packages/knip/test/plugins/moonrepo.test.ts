import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/moonrepo');

test('Find dependencies with the moonrepo plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.binaries['.moon/tasks.yml']['ls-lint']);
  assert(issues.binaries['.moon/tasks/typescript.yml']['tsc']);
  assert(issues.binaries['.moon/tasks/typescript.yml']['eslint']);
  assert(issues.binaries['moon.yml']['vite-node']);
  assert(issues.binaries['moon.yml']['vitest']);
  assert(issues.binaries['moon.yml']['tsx']);

  assert(issues.devDependencies['package.json']['@moonrepo/cli']);
  assert(issues.devDependencies['package.json']['vite-node']);
  assert(issues.devDependencies['package.json']['eslint']);
  assert(issues.devDependencies['libs/b/package.json']['vitest']);

  assert(issues.files.has(join(cwd, 'libs/b/server/server.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    devDependencies: 4,
    binaries: 6,
    processed: 3,
    total: 3,
  });
});

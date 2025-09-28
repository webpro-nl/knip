import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/astro');

test('Find dependencies with the Astro plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/consts.ts']['UNUSED']);

  assert(issues.files.has(join(cwd, 'src/pages/_top-level-file-unused.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/_top-level-dir-unused/index.ts')));

  assert(issues.files.has(join(cwd, 'src/pages/blog/_nested-unused-file.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util/unused-component.astro')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util/nested/deeply-nested-unused-file.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 5,
    processed: 26,
    total: 26,
  });
});

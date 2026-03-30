import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/astro');

test('Find dependencies with the Astro plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/consts.ts']['UNUSED']);

  assert('src/pages/_top-level-file-unused.ts' in issues.files);
  assert('src/pages/_top-level-dir-unused/index.ts' in issues.files);

  assert('src/pages/blog/_nested-unused-file.ts' in issues.files);
  assert('src/pages/blog/_util/unused-component.astro' in issues.files);
  assert('src/pages/blog/_util/nested/deeply-nested-unused-file.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 5,
    processed: 25,
    total: 26,
  });
});

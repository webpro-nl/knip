import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/astro');

test('Find dependencies with the Astro plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
    isDebug: true,
  });
  
  assert(issues.exports["src/consts.ts"]["UNUSED"])

  assert(issues._files["fixtures/plugins/astro/src/pages/_top-level-file-unused.ts"])
  assert(issues._files["fixtures/plugins/astro/src/pages/_top-level-dir-unused/index.ts"])
  
  assert(issues._files["fixtures/plugins/astro/src/pages/blog/_nested-unused-file.ts"])
  assert(issues._files["fixtures/plugins/astro/src/pages/blog/_util/unused-component.astro"])
  assert(issues._files["fixtures/plugins/astro/src/pages/blog/_util/nested/deeply-nested-unused-file.ts"])

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 5,
    processed: 26,
    total: 26,
  });
});

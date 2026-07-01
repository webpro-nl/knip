import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/stencil');

test('Find dependencies and credit @Component with the Stencil plugin', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  const flagged = new Set(Object.values(issues.exports).flatMap(byId => Object.keys(byId)));
  assert(!flagged.has('MyController')); // @Component({ tag }) class, used only by tag, is credited

  // A genuinely unused sibling export is still flagged (proves the file is analyzed, not entry-exempt):
  assert.equal(issues.exports['src/my-controller.ts'].unusedHelper.symbol, 'unusedHelper');

  // A genuinely unused scss file is still flagged (proves the file is analyzed, not exempt):
  assert('src/components/unused.scss' in issues.files);

  // `*.spec`/`*.e2e` test files and `testing.setupFilesAfterEnv` setup are entries, not unused files (files: 0):
  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    exports: 1,
    processed: 17,
    total: 17,
  });
});

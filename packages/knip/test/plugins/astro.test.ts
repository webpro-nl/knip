import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the Astro plugin', async () => {
  const cwd = resolve('fixtures/plugins/astro');
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
    processed: 26,
    total: 26,
  });
});

test('Detect imports from <style lang="scss|less|stylus"> in .astro components', async () => {
  const cwd = resolve('fixtures/plugins/astro-styles');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('src/styles/_unused.scss' in issues.files);
  assert('src/styles/unused.less' in issues.files);
  assert('src/styles/unused.styl' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 8,
    total: 8,
  });
});

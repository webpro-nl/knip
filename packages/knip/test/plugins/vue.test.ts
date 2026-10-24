import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Support compiler functions in config (vue)', async () => {
  const cwd = resolve('fixtures/plugins/vue');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Detect imports from <style lang="scss|less|stylus"> in .vue SFCs', async () => {
  const cwd = resolve('fixtures/plugins/vue-styles');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('styles/_unused.scss' in issues.files);
  assert('styles/unused.less' in issues.files);
  assert('styles/unused.styl' in issues.files);
  assert(!('styles/panel.less' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 9,
    total: 9,
  });
});

test('Detect <script src> and <style src> in .vue SFCs', async () => {
  const cwd = resolve('fixtures/plugins/vue-src');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('badge.ts' in issues.exports));
  assert(issues.exports['Badge.vue']['default']);
  assert(!('node.ts' in issues.files));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    processed: 8,
    total: 8,
  });
});

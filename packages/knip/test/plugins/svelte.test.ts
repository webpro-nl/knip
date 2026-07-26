import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Use compilers (svelte)', async () => {
  const cwd = resolve('fixtures/plugins/svelte');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['svelte']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 18,
    total: 18,
  });
});

test('Detect imports from <style lang="scss|less|stylus"> in .svelte components', async () => {
  const cwd = resolve('fixtures/plugins/svelte-styles');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('styles/_unused.scss' in issues.files);
  assert('styles/unused.less' in issues.files);
  assert('styles/unused.styl' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 3,
    processed: 7,
    total: 7,
  });
});

test('Detect dynamic imports from Svelte template markup (built-in compiler)', async () => {
  const cwd = resolve('fixtures/plugins/svelte-template-import');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  // `Lazy.svelte` is referenced only via `{#await import('./Lazy.svelte')}` in
  // App.svelte's template. The built-in compiler used to scan <script> only, so
  // it was reported as an unused file.
  assert(!('Lazy.svelte' in issues.files));
  assert.deepEqual(Object.keys(issues.files), []);

  assert.deepEqual(counters, { ...baseCounters, processed: 3, total: 3 });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { dynamicImportsWithinTemplate } from '../../src/compilers/svelte.ts';
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

  assert('Removed.svelte' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 18,
    total: 18,
  });
});

test('Extract literal dynamic imports from Svelte template expressions', () => {
  const source = [
    `<script>import('./script.js')</script>`,
    `<style>import('./style.js')</style>`,
    `<!-- import('./html-comment.js') -->`,
    `<code>import('./markup.js')</code>`,
    `<div title="import('./attribute.js')">`,
    `<div title="prefix {import('./mixed-attribute.svelte')} suffix">`,
    `{"import('./string.js')"}`,
    `{/* import('./block-comment.js') */}`,
    '{`import("./template-raw.js")`}',
    `<button onclick={() => ({ load: () => import('./nested.svelte') })}>`,
    '<button onclick={() => `${import("./template-interpolation.svelte")}`}>',
    '{#await import /* before call */ (`./backtick.svelte`) then Component}<Component />{/await}',
    `<button onclick={() => import(/* before specifier */ './escaped\\u002esvelte', { with: { type: 'json' } })}>`,
    `<button onclick={() => import // before call\n('./line-comment.svelte')}>`,
    `<button onclick={() => import('./O\\'Brien.svelte')}>`,
  ].join('\n');

  assert.equal(
    dynamicImportsWithinTemplate(source, 'Component.svelte'),
    [
      "import('./mixed-attribute.svelte')",
      "import('./nested.svelte')",
      'import("./template-interpolation.svelte")',
      'import /* before call */ (`./backtick.svelte`)',
      "import(/* before specifier */ './escaped\\u002esvelte', { with: { type: 'json' } })",
      "import // before call\n('./line-comment.svelte')",
      "import('./O\\'Brien.svelte')",
    ].join(';\n')
  );
});

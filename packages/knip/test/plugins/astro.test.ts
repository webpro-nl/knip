import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { join } from '../../src/util/path.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';


test('Find dependencies at various levels of nesting with the Astro plugin', async () => {
  const cwd = resolve('fixtures/plugins/astro--file-nesting');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.exports['src/consts.ts']['UNUSED']);
  assert(issues.files.has(join(cwd, 'src/pages/_top-level-file-unused.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/_top-level-dir-unused/index.ts')));

  assert(issues.files.has(join(cwd, 'src/pages/blog/_nested-unused-file.ts')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_nested-used-file.ts')) === false);
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util/unused-component.astro')));
  assert(issues.files.has(join(cwd, 'src/pages/blog/_util/nested/deeply-nested-unused-file.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    exports: 1,
    files: 5,
    processed: 27,
    total: 27,
  });
});

test('Find dependencies of various filetypes with the Astro plugin', async () => {
const cwd = resolve('fixtures/plugins/astro--file-types');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.dependencies["package.json"]["is-even"])
  assert(issues.files.has(join(cwd, "src/imports/unused.css")))
  assert(issues.files.has(join(cwd, "src/imports/unused.ts")))
  assert(issues.files.has(join(cwd, "src/imports/unused-js.js")))
  assert(issues.files.has(join(cwd, "src/imports/unused.astro")))
  
  assert(!issues.dependencies["package.json"]["is-odd"])
  assert(!issues.files.has(join(cwd, "src/imports/used.css")))
  assert(!issues.files.has(join(cwd, "src/imports/used.ts")))
  assert(!issues.files.has(join(cwd, "src/imports/used-js.js")))
  assert(!issues.files.has(join(cwd, "src/imports/used.astro")))
});

test('Find dependencies by following various kinds of import', async () => {
const cwd = resolve('fixtures/plugins/astro--import-strategies');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(issues.files.has(join(cwd, "src/imports/frontmatter-import-unused.ts")))
  assert(issues.files.has(join(cwd, "src/imports/script-src-import-unused.ts")))
  assert(issues.files.has(join(cwd, "src/imports/script-text-import-unused.ts")))

  assert(!issues.files.has(join(cwd, "src/imports/frontmatter-import-used.ts")))
  assert(!issues.files.has(join(cwd, "src/imports/script-src-import-used.ts")))
  assert(!issues.files.has(join(cwd, "src/imports/script-text-import-used.ts")))
});
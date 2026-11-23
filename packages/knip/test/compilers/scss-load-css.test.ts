import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/compilers/scss-load-css');

test('Built-in compiler for SCSS meta.load-css with static URLs', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert('_line-commented.scss' in issues.files);
  assert('_block-commented.scss' in issues.files);
  assert('_in-double-quotes.scss' in issues.files);
  assert('_in-single-quotes.scss' in issues.files);
  assert('themes/_dark.scss' in issues.files);
  assert('_themes.scss' in issues.files);
  assert('_lookalike.scss' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 7,
    processed: 16,
    total: 16,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/postcss-next');

test('Find dependencies with the PostCSS plugin (implicit w/ Next.js)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['autoprefixer']);
  assert(issues.unresolved['postcss.config.json']['autoprefixer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
  });
});

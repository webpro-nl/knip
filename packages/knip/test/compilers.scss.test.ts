import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.js';
import { join } from '../src/util/path.js';
import baseCounters from './helpers/baseCounters.js';
import { createOptions } from './helpers/create-options.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/compilers-scss');

test('Built-in compiler for SCSS', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'unused.scss')));
  assert(issues.files.has(join(cwd, '_partial.scss')));
  assert(issues.unresolved['styles.scss']['./partial']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    files: 2,
    unresolved: 1,
    processed: 14,
    total: 14,
  });
});

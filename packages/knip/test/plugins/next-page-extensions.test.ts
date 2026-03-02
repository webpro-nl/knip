import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-page-extensions');

test('Find dependencies with the Next.js plugin (custom pageExtensions)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.files.has(join(cwd, 'src/unused.ts')));

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 4,
    total: 4,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../../src/util/create-options.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/url-import-meta-url');

test('Support URL constructor using import.meta.url', async () => {
  const options = await createOptions({ cwd, tags: ['-knipignore'] });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.unlisted['index.ts']), ['unlisted-url-package']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 4,
    total: 4,
  });
});

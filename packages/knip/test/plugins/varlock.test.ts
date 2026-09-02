import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/varlock');

test('Find dependencies with the varlock plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.unlisted['.env.schema']), ['missing-plugin']);
  assert(issues.unresolved['.env.schema']['./missing.env']);
  assert(!issues.unresolved['.env.schema']['./optional.env']);
  assert(!issues.unresolved['.env.schema']['./disabled.env']);
  assert(!issues.unlisted['.env.schema']['after-header-plugin']);
  assert(!issues.unlisted['.env.schema']['comment-plugin']);
  assert(!issues.unlisted['.env.schema']['trailing-comment-plugin']);
  assert(!issues.unlisted['.env.local']);
  assert(!issues.unlisted['.env.malformed']);
  assert(!issues.unlisted['.env.staging']);
  assert(!issues.files['app.js']);
  assert(!issues.files['local-plugin/index.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    unresolved: 1,
    processed: 3,
    total: 3,
  });
});

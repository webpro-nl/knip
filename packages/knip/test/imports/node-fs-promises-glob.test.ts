import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/imports/node-fs-promises-glob');

test('Resolve statically analyzable node:fs/promises glob patterns as entry files', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 7,
    processed: 13,
    total: 13,
  });

  // Unsupported forms remain uncredited
  assert('bang/!one.ts' in issues.files);
  assert('dynamic/one.ts' in issues.files);
  assert('extra-options/one.ts' in issues.files);
  assert('indirect-options/one.ts' in issues.files);
  assert('nested/one.ts' in issues.files);
  assert('no-follow/one.ts' in issues.files);
  assert('spread-options/one.ts' in issues.files);

  // Supported forms are credited
  assert(!('migrations/one.ts' in issues.files));
  assert(!('root/one.ts' in issues.files));
  assert(!('workspace-cwd/one.ts' in issues.files));
  assert(!('workspace-default/one.ts' in issues.files));
});

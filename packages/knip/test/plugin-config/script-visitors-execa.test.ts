import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugin-config/script-visitors-execa');

test('Find dependencies with custom script visitors (execa)', async () => {
  const options = await createOptions({ cwd });
  const { counters, issues } = await main(options);

  assert(!issues.binaries['methods.mjs']?.phantomexeca);
  assert(!issues.binaries['methods.mjs']?.config);
  assert(!issues.binaries['execa-docs.mjs']?.config);
  assert(!issues.files['execa-node.mjs']);
  assert(!issues.files['execa-node-tag.mjs']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 8,
    total: 8,
  });
});

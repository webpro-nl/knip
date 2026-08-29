import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/tags-hints/tags-suppress');

test('No unused-tag hint when tag suppresses enum member refs (resolve #1957)', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, tagHints } = await main(options);

  assert.equal(tagHints.size, 0);
  assert(!issues.enumMembers?.[cwd]?.length);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

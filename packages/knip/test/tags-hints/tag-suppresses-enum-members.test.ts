import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/tags-hints/tag-suppresses-enum-members');

test('Do not flag a tag that suppresses enum member issues', async () => {
  const options = await createOptions({ cwd, tags: ['-knipignore'] });
  const { issues, tagHints, counters } = await main(options);

  assert.equal(tagHints.size, 0);
  assert.equal(Object.keys(issues.enumMembers).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('The same enum members are reported when the tag is not excluded', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.enumMembers['status.ts']['StatusCode.normal']);
  assert(issues.enumMembers['status.ts']['StatusCode.unknown']);
  assert(issues.enumMembers['status.ts']['StatusCode.warning']);
  assert(issues.enumMembers['status.ts']['StatusCode.critical']);
  assert(issues.enumMembers['status.ts']['StatusCode.nostatus']);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 5,
    processed: 3,
    total: 3,
  });
});

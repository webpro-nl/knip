import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/tags-hints/tag-suppresses-members');

test('Do not flag a tag that suppresses member issues', async () => {
  const options = await createOptions({ cwd });
  const { issues, tagHints, counters } = await main(options);

  assert.deepEqual(
    tagHints,
    new Set([{ type: 'tag', filePath: join(cwd, 'status.ts'), identifier: 'Level', tagName: '@knipignore' }])
  );

  assert.equal(Object.keys(issues.enumMembers).length, 0);
  assert.equal(Object.keys(issues.namespaceMembers).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Report the members a tag suppresses when the tag is not configured', async () => {
  const options = await createOptions({ cwd, tags: ['-unrelated'] });
  const { issues, tagHints, counters } = await main(options);

  assert(issues.enumMembers['status.ts']['StatusCode.warning']);
  assert(issues.enumMembers['status.ts']['StatusCode.critical']);
  assert(issues.namespaceMembers['status.ts']['Settings.retries']);
  assert.equal(tagHints.size, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    enumMembers: 2,
    namespaceMembers: 1,
    processed: 3,
    total: 3,
  });
});

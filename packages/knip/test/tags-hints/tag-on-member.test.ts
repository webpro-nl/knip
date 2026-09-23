import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/tags-hints/tag-on-member');

test('Flag a tag on a referenced member', async () => {
  const options = await createOptions({ cwd });
  const { issues, tagHints, counters } = await main(options);

  assert.deepEqual(
    tagHints,
    new Set([
      { type: 'tag', filePath: join(cwd, 'status.ts'), identifier: 'Fruit.apple', tagName: '@knipignore' },
      { type: 'tag', filePath: join(cwd, 'status.ts'), identifier: 'Basket.size', tagName: '@knipignore' },
    ])
  );

  assert.equal(Object.keys(issues.enumMembers).length, 0);
  assert.equal(Object.keys(issues.namespaceMembers).length, 0);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

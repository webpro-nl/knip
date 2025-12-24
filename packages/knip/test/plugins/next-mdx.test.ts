import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import baseCounters from '../helpers/baseCounters.js';
import { createOptions } from '../helpers/create-options.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/next-mdx');

test('Find dependencies with the @next/mdx plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unlisted['next.config.js']['remark-frontmatter']);
  assert(issues.unlisted['next.config.js']['remark-mdx-frontmatter']);
  assert(issues.unlisted['next.config.js']['rehype-starry-night']);
  assert(issues.unlisted['next.config.js']['recma-export-filepath']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 4,
    processed: 2,
    total: 2,
  });
});

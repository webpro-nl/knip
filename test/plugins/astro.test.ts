import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/astro');

test('Find dependencies in Astro configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['src/content/config.ts']['astro:content']);
  assert(issues.unlisted['src/pages/rss.xml.js']['astro:content']);
  assert(issues.unlisted['src/pages/blog/[...slug].astro']['astro:content']);
  assert(issues.unlisted['src/pages/blog/index.astro']['astro:content']);
  assert(issues.unlisted['src/layouts/BlogPost.astro']['astro:content']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 5,
    processed: 17,
    total: 17,
  });
});

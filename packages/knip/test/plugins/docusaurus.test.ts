import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { main } from '../../src/index.js';
import { resolve } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';

const cwd = resolve('fixtures/plugins/docusaurus');

test('Find dependencies with the docusaurus plugin', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unresolved['docusaurus.config.js']['@docusaurus/theme-search-algolia']);
  assert(issues.unresolved['docusaurus.config.js']['@docusaurus/plugin-content-blog']);

  assert(issues.dependencies['package.json']['@mdx-js/react']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    dependencies: 1,
    processed: 5,
    total: 5,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.js';
import { createOptions } from '../../src/util/create-options.js';
import baseCounters from '../helpers/baseCounters.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/plugins/docusaurus');

test('Find dependencies with the docusaurus plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['docusaurus.config.js']['@docusaurus/theme-search-algolia']);
  assert(issues.unresolved['docusaurus.config.js']['@docusaurus/plugin-content-blog']);

  assert(issues.dependencies['package.json']['@mdx-js/react']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 2,
    dependencies: 1,
    processed: 8,
    total: 8,
  });
});

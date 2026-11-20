import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/docusaurus');

test('Find dependencies and literal script entries with the docusaurus plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files), ['static/js/v/client.js']);

  assert(issues.unlisted['docusaurus.config.js']['@docusaurus/theme-search-algolia']);
  assert(issues.unlisted['docusaurus.config.js']['@docusaurus/plugin-content-blog']);
  assert(issues.unlisted['docusaurus.config.js']['docusaurus-plugin-sass']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 3,
    files: 1,
    processed: 17,
    total: 17,
  });
});

test('Find dependencies with the docusaurus plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['package.json']['@docusaurus/theme-mermaid']);
  assert(!issues.dependencies['package.json']['@docusaurus/preset-classic']);
  assert(issues.dependencies['package.json']['@docusaurus/plugin-sitemap']);
  assert.deepEqual(Object.keys(issues.unlisted['docusaurus.config.js']), ['@docusaurus/theme-search-algolia']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 7,
    unlisted: 1,
    files: 1,
    processed: 14,
    total: 14,
  });
});

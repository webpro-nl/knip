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

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 2,
    files: 1,
    processed: 17,
    total: 17,
  });
});

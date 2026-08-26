import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/infra/gitignore-mixed-patterns');

test('Preserve the crawl root for mixed patterns', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters, configurationHints } = await main(options);

  assert.deepEqual(issues.files, {});
  assert.deepEqual(configurationHints, [
    { type: 'project-redundant', identifier: 'src/entry.ts', workspaceName: '.' },
    { type: 'project-empty', identifier: 'ignored/*.ts', workspaceName: '.' },
  ]);
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

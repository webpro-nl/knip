import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/rspress');
const defaultsCwd = resolve('fixtures/plugins/rspress-defaults');
const fnConfigCwd = resolve('fixtures/plugins/rspress-function-config');

test('Find dependencies and entries with the Rspress plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'guide/_unused-partial.mdx',
    'guide/drafts/wip.mdx',
    'guide/public/snippet.ts',
    'src/unused.ts',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 18,
    total: 18,
  });
});

test('Find dependencies and entries with the Rspress plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), [
    'guide/_unused-partial.mdx',
    'guide/drafts/wip.mdx',
    'guide/public/snippet.ts',
    'src/unused.ts',
  ]);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 4,
    processed: 17,
    total: 17,
  });
});

test('Find default entries and CLI root with the Rspress plugin', async () => {
  const options = await createOptions({ cwd: defaultsCwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(Object.keys(issues.files).sort(), ['docs/_unused-snippet.mdx', 'site/_unused-site-partial.mdx']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    processed: 5,
    total: 5,
  });
});

test('Find entries from function config via --config with the Rspress plugin', async () => {
  const options = await createOptions({ cwd: fnConfigCwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 5,
    total: 5,
  });
});

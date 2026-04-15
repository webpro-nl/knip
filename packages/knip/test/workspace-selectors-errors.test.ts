import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

const cwd = resolve('fixtures/workspaces');

test('Error: non-existent package name (exact match)', async () => {
  await assert.rejects(
    async () => {
      const options = await createOptions({ cwd, workspace: '@nonexistent/package' });
      await main(options);
    },
    (error: Error) => {
      return error.message.includes('did not match any workspaces') && error.message.includes('@nonexistent/package');
    },
    'Should throw ConfigurationError for non-existent exact package name'
  );
});

test('Error: non-existent directory path', async () => {
  await assert.rejects(
    async () => {
      const options = await createOptions({ cwd, workspace: 'packages/nonexistent' });
      await main(options);
    },
    (error: Error) => {
      return error.message.includes('not found') && error.message.includes('packages/nonexistent');
    },
    'Should throw ConfigurationError for non-existent directory'
  );
});

test('Error: directory glob with no matches', async () => {
  await assert.rejects(
    async () => {
      const options = await createOptions({ cwd, workspace: './nonexistent/*' });
      await main(options);
    },
    (error: Error) => {
      return error.message.includes('did not match any workspaces') && error.message.includes('nonexistent/*');
    },
    'Should throw ConfigurationError for directory glob with no matches'
  );
});

test('No error: package name glob with no matches (wildcards allowed)', async () => {
  // This should NOT throw because globs can match 0 workspaces
  const options = await createOptions({ cwd, workspace: '@nonexistent/*' });
  const { counters } = await main(options);
  assert.equal(counters.total, 0, 'Should have 0 total issues when no workspaces selected');
  assert.equal(counters.processed, 0, 'Should have 0 processed files when no workspaces selected');
});

test('No error: package name glob with ? and [] with no matches', async () => {
  const options1 = await createOptions({ cwd, workspace: '@nonexistent/?' });
  const { counters: counters1 } = await main(options1);
  assert.equal(counters1.total, 0);
  assert.equal(counters1.processed, 0);

  const options2 = await createOptions({ cwd, workspace: '@nonexistent/[ab]' });
  const { counters: counters2 } = await main(options2);
  assert.equal(counters2.total, 0);
  assert.equal(counters2.processed, 0);
});

test('No error: negated directory glob with no matches', async () => {
  const options = await createOptions({
    cwd,
    workspace: ['@fixtures/workspaces__*', '!./nonexistent/*'],
  });
  const { counters } = await main(options);
  assert(counters.total > 0, 'Should still analyze workspaces when negation matches nothing');
});

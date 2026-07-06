import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Find dependencies with the starlight plugin', async () => {
  const cwd = resolve('fixtures/plugins/starlight/base');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 3,
    total: 3,
  });
});

test('Find custom CSS with the starlight plugin', async () => {
  const cwd = resolve('fixtures/plugins/starlight/custom-css');
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 3,
    total: 3,
    files: 1,
  });
});

test('Find plugins with the starlight plugin (production strict)', async () => {
  const cwd = resolve('fixtures/plugins/starlight/plugins');
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues, counters } = await main(options);

  assert(
    !issues.dependencies['package.json']?.['starlight-blog'],
    'starlight-blog should be detected as used via starlight `plugins`'
  );

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 2,
  });
});

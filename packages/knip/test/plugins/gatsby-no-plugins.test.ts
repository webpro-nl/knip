import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/gatsby-no-plugins');

test('Find production entries with the Gatsby plugin when gatsby-config has no plugins', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!('src/pages/about.tsx' in issues.files));
  assert(issues.devDependencies['package.json']['gatsby']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    processed: 2,
    total: 2,
  });
});

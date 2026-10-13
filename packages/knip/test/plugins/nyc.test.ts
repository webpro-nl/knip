import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/nyc');

test('Find dependencies with the nyc plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.devDependencies['package.json']['nyc']);
  assert(issues.unlisted['.nycrc.json']['@istanbuljs/nyc-config-typescript']);
  assert(issues.unlisted['nyc.config.cjs']['@istanbuljs/nyc-config-babel']);
  assert(issues.unlisted['nyc.config.mjs']['@babel/register']);

  assert.deepEqual(counters, {
    ...baseCounters,
    devDependencies: 1,
    unlisted: 3,
    processed: 2,
    total: 2,
  });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/jest-module-calls');

test('Find modules used through Jest calls in tests and setup files', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.equal(issues.dependencies['package.json']?.['@babel/core'], undefined);
  assert.equal(issues.dependencies['package.json']?.react, undefined);
  assert(issues.dependencies['package.json']['unused-package']);
  assert(issues.unlisted['setup.ts']['unlisted-react']);
  assert('ignored-module.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    dependencies: 1,
    devDependencies: 1,
    unlisted: 1,
    processed: 7,
    total: 7,
  });
});

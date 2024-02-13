import assert from 'node:assert/strict';
import test from 'node:test';
import { default as msw } from '../../src/plugins/msw/index.js';
import { resolve, join } from '../../src/util/path.js';
import { buildOptions } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/msw');
const options = buildOptions(cwd);

test('Find dependencies in msw configuration', async () => {
  const configFilePath = join(cwd, 'msw.toml');
  const dependencies = await msw.findDependencies(configFilePath, options);

  assert.deepEqual(dependencies, [
    'entry:**/mockServiceWorker.{js,ts}',
    'entry:mocks/browser.{js,ts}',
    'entry:mocks/handlers.{js,ts}"',
    'entry:mocks/index.{js,ts}"',
    'entry:mocks/server.{js,ts}"',
  ]);
});

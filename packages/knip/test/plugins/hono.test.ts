import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/hono');

test('Find Hono application entry files and their imported routers', async () => {
  for (const isProduction of [false, true]) {
    const options = await createOptions({ cwd, isProduction });
    const { issues } = await main(options);

    assert(issues.files['src/orphan.ts']);
    assert.equal(issues.files['src/server.ts'], undefined);
    assert.equal(issues.files['src/routes.ts'], undefined);
  }
});

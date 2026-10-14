import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-turbopack-aliases');

for (const isProduction of [false, true]) {
  test(`Preserve Next.js Turbopack alias targets (production: ${isProduction})`, async () => {
    const options = await createOptions({ cwd, isProduction });
    const { issues } = await main(options);

    assert.deepEqual(Object.keys(issues.exports), ['apps/web/adapters/unused-export.ts']);
    assert.deepEqual(Object.keys(issues.files), ['apps/web/adapters/unrelated.ts']);
    assert.deepEqual(issues.dependencies, {});
    assert.deepEqual(issues.unlisted, {});
    assert.deepEqual(issues.unresolved, {});
  });
}

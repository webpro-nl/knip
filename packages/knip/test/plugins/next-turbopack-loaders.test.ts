import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/next-turbopack-loaders');

for (const isProduction of [false, true]) {
  test(`Find Next.js Turbopack loaders and alias targets (production: ${isProduction})`, async () => {
    const options = await createOptions({ cwd, isProduction, isIncludeEntryExports: true });
    const { issues, counters } = await main(options);

    assert.deepEqual(issues.dependencies, {});
    assert.deepEqual(
      Object.keys(issues.files).sort(),
      isProduction ? ['loaders/server.cjs', 'unused.ts'] : ['unused.ts']
    );
    if (!isProduction) assert.deepEqual(Object.keys(issues.devDependencies['package.json']), ['unused-loader']);
    assert.deepEqual(counters, {
      ...baseCounters,
      devDependencies: isProduction ? 0 : 1,
      files: isProduction ? 2 : 1,
      processed: isProduction ? 6 : 7,
      total: isProduction ? 6 : 7,
    });
  });
}

for (const isProduction of [false, true]) {
  test(`Find alias targets in both conditional Turbopack branches (production: ${isProduction})`, async () => {
    const cwd = resolve('fixtures/plugins/next-turbopack-aliases-conditional');
    const options = await createOptions({ cwd, isProduction, isIncludeEntryExports: true });
    const { issues, counters } = await main(options);

    assert.deepEqual(Object.keys(issues.files), ['unused.ts']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: 1,
      processed: isProduction ? 3 : 4,
      total: isProduction ? 3 : 4,
    });
  });
}

for (const isProduction of [false, true]) {
  test(`Find Turbopack loaders in loaded shared Next.js config factories (production: ${isProduction})`, async () => {
    const cwd = resolve('fixtures/plugins/next-turbopack-loaders-workspace');
    const options = await createOptions({ cwd, isProduction });
    const { issues, counters, hasConfigLoadErrors } = await main(options);

    assert.equal(hasConfigLoadErrors, false);
    assert.deepEqual(
      Object.keys(issues.dependencies['apps/combined/package.json']).sort(),
      isProduction ? ['@tailwindcss/turbopack', '@workspace/next-config'] : ['@tailwindcss/turbopack']
    );
    assert.deepEqual(Object.keys(issues.dependencies['packages/next-config/package.json']), ['@shared/md-loader']);
    if (!isProduction) {
      assert.deepEqual(Object.keys(issues.devDependencies['apps/web/package.json']), ['unused-loader']);
      assert.deepEqual(Object.keys(issues.unlisted['apps/web/next.config.ts']), ['@shared/md-loader']);
    }
    assert.deepEqual(Object.keys(issues.files).sort(), [
      'apps/admin/loaders/raw.cjs',
      'apps/admin/polyfills/legacy.ts',
    ]);
    assert.deepEqual(Object.keys(issues.exports['packages/next-config/base.ts']), ['unusedBaseOption']);
    assert.deepEqual(counters, {
      ...baseCounters,
      dependencies: isProduction ? 3 : 2,
      devDependencies: isProduction ? 0 : 1,
      exports: 1,
      files: 2,
      unlisted: isProduction ? 0 : 1,
      processed: isProduction ? 4 : 7,
      total: isProduction ? 4 : 7,
    });
  });
}

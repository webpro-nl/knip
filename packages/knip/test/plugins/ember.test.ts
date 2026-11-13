import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/ember');

for (const isProduction of [false, true]) {
  test(`Find Ember 7 app entries and implicit addons (isProduction: ${isProduction})`, async () => {
    const { counters, issues } = await main(await createOptions({ cwd, isProduction, isIncludeSubpathExports: true }));
    assert.deepEqual(Object.keys(issues.files).sort(), [
      'app/utils/unused.ts',
      ...(isProduction ? ['tests/helpers/setup.js'] : []),
      'tests/helpers/unused.js',
    ]);
    if (!isProduction) {
      assert.deepEqual(Object.keys(issues.devDependencies['package.json']).sort(), [
        'ember-modifier',
        'ember-source-channel-url',
      ]);
    }
    assert(issues.exports['app/utils/fruit.ts']['unused']);
    assert(issues.unlisted['app/initializers/waiters.js']['@ember/test-waiters']);
    assert.deepEqual(counters, {
      ...baseCounters,
      files: isProduction ? 3 : 2,
      devDependencies: isProduction ? 0 : 2,
      unlisted: 1,
      exports: 1,
      processed: isProduction ? 21 : 26,
      total: isProduction ? 21 : 26,
    });
  });
}

test('Find Ember v2 addon entries, built sources and addon main with ember-source as a peer', async () => {
  const cwd = resolve('fixtures/plugins/ember-addon');
  const { counters, issues } = await main(await createOptions({ cwd }));
  assert.deepEqual(Object.keys(issues.files), ['src/unused.ts']);
  assert.deepEqual(counters, { ...baseCounters, files: 1, processed: 10, total: 10 });
});

test('Find Ember classic app entries, in-repo addons, app name imports and modules provided by addons', async () => {
  const cwd = resolve('fixtures/plugins/ember-classic');
  const { counters, issues } = await main(await createOptions({ cwd }));
  assert.deepEqual(Object.keys(issues.files).sort(), ['app/utils/unused.js', 'tests/helpers/unused.js']);
  assert(issues.unlisted['app/deprecation-workflow.js']['@ember/test-waiters']);
  assert(issues.unlisted['app/routes/fruit.js']['@ember/edition-utils']);
  assert.deepEqual(counters, { ...baseCounters, files: 2, unlisted: 2, processed: 23, total: 23 });
});

test('Credit Ember addons in devDependencies as development dependencies', async () => {
  const cwd = resolve('fixtures/plugins/ember-classic');
  const { counters, issues } = await main(await createOptions({ cwd, isProduction: true, isStrict: true }));
  assert.deepEqual(Object.keys(issues.unlisted['package.json'] ?? {}), []);
  assert.deepEqual(counters, { ...baseCounters, files: 3, unlisted: 3, processed: 11, total: 11 });
});

test('Find Ember v1 addon entries, dummy app and blueprints', async () => {
  const cwd = resolve('fixtures/plugins/ember-v1-addon');
  const { counters, issues } = await main(await createOptions({ cwd }));
  assert.deepEqual(Object.keys(issues.files), ['tests/helpers/unused.js']);
  assert.deepEqual(counters, { ...baseCounters, files: 1, processed: 17, total: 17 });
});

test('Honor Ember entry overrides when an environment config is present', async () => {
  const { issues } = await main(
    await createOptions({
      cwd,
      isIncludeSubpathExports: true,
      args: { config: resolve('fixtures/plugins/ember/overrides.json') },
    })
  );
  assert('app/transforms/fruit.ts' in issues.files);
  assert('app/routes/fruit.ts' in issues.files);
  assert('ember-cli-build.js' in issues.files);
});

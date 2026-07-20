import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import openclaw from '../../src/plugins/openclaw/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/plugins/openclaw');

test('Treat public OpenClaw package entries as production entries', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { counters, issues } = await main(options);

  assert('channel-plugin-api.ts' in issues.files);
  assert('src/dead.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    total: 12,
    processed: 12,
  });
});

test('Enable from the native manifest', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/openclaw-manifest-only'),
    isProduction: true,
    isStrict: true,
  });
  const { counters, issues } = await main(options);

  assert(!('bootstrap.ts' in issues.files));
  assert('plugin/unrelated.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    total: 2,
    processed: 2,
  });
});

test('Discover entries from the native plugin manifest', async () => {
  const options = await createOptions({
    cwd: resolve('fixtures/plugins/openclaw-plugin-manifest-only'),
    isProduction: true,
    isStrict: true,
  });
  const { counters, issues } = await main(options);

  assert(!('provider-discovery.ts' in issues.files));
  assert('unrelated.ts' in issues.files);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    total: 2,
    processed: 2,
  });
});

test('Enable from OpenClaw package metadata', async () => {
  const isEnabled = openclaw.isEnabled;
  assert(isEnabled);

  for (const manifest of [
    { openclaw: { schemaVersions: {} } },
    { openclaw: { runtimeExtensions: ['./dist/index.js'] } },
    { openclaw: { runtimeSetupEntry: './dist/setup-entry.js' } },
  ]) {
    assert.equal(
      await isEnabled({
        config: {},
        cwd: resolve('fixtures/plugins/openclaw-sdk-only'),
        dependencies: new Set(),
        manifest,
      }),
      true
    );
  }
});

test('Do not enable from the private OpenClaw SDK dependency', async () => {
  const isEnabled = openclaw.isEnabled;
  assert(isEnabled);

  assert.equal(
    await isEnabled({
      config: {},
      cwd: resolve('fixtures/plugins/openclaw-sdk-only'),
      dependencies: new Set(['@openclaw/plugin-sdk']),
      manifest: {},
    }),
    false
  );
});

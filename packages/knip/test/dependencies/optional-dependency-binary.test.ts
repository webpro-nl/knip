import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/optional-dependency-binary');
const installedCwd = resolve('fixtures/dependencies/optional-dependency-binary-installed');

for (const isStrict of [false, true]) {
  test(`Do not report absent optional dependencies as unlisted binaries when names match (strict: ${isStrict})`, async () => {
    const { issues, counters } = await main(await createOptions({ cwd, isStrict }));

    assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), []);
    assert.deepEqual(counters, { ...baseCounters, processed: 0, total: 0 });
  });

  test(`Match installed optional dependencies to their actual binaries (strict: ${isStrict})`, async () => {
    const { issues, counters } = await main(await createOptions({ cwd: installedCwd, isStrict }));

    assert.deepEqual(Object.keys(issues.binaries['package.json'] ?? {}), ['optional']);
    assert.deepEqual(counters, { ...baseCounters, binaries: 1, processed: 0, total: 0 });
  });
}

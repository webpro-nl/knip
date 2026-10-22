import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

for (const { fixture, processed } of [
  { fixture: 'v2', processed: 1 },
  { fixture: 'v1', processed: 1 },
  { fixture: 'v1beta1', processed: 0 },
  { fixture: 'templates', processed: 1 },
]) {
  test(`Find Buf generator dependencies and entries (${fixture})`, async () => {
    const cwd = resolve(`fixtures/plugins/buf/${fixture}`);
    const options = await createOptions({ cwd });
    const { counters } = await main(options);

    assert.deepEqual(counters, {
      ...baseCounters,
      processed,
      total: processed,
    });
  });
}

for (const fixture of ['remote', 'remote-v1', 'empty-plugins', 'no-config']) {
  test(`Do not mark the npm generator as used (${fixture})`, async () => {
    const cwd = resolve(`fixtures/plugins/buf/${fixture}`);
    const options = await createOptions({ cwd });
    const { issues, counters } = await main(options);

    assert.ok(issues.devDependencies['package.json']?.['@bufbuild/protoc-gen-es']);

    assert.deepEqual(counters, {
      ...baseCounters,
      devDependencies: 1,
      processed: 0,
      total: 0,
    });
  });
}

test('Do not make the generated output directory an entry', async () => {
  const cwd = resolve('fixtures/plugins/buf/unreachable-output');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.ok(issues.files['src/__generated__/unused.ts']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 1,
    total: 1,
  });
});

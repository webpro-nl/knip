import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const dependency = '@bufbuild/protoc-gen-es';

const cases = [
  {
    fixture: 'local-string',
    name: 'Find the generator dependency from a local command',
    unusedDependencies: 0,
  },
  {
    fixture: 'local-array',
    name: 'Find the generator dependency from a local command array',
    unusedDependencies: 0,
  },
  {
    fixture: 'remote',
    name: 'Do not mark the npm generator as used by a remote plugin',
    unusedDependencies: 1,
  },
  {
    fixture: 'custom-command',
    name: 'Do not mark the npm generator as used by another local command',
    unusedDependencies: 1,
  },
  {
    fixture: 'empty-plugins',
    name: 'Do not mark the generator as used when there are no plugins',
    unusedDependencies: 1,
  },
  {
    fixture: 'no-config',
    name: 'Do not mark the generator as used without a Buf configuration',
    unusedDependencies: 1,
  },
];

for (const { fixture, name, unusedDependencies } of cases) {
  test(name, async () => {
    const cwd = resolve(`fixtures/plugins/buf/${fixture}`);
    const options = await createOptions({ cwd });
    const { issues, counters } = await main(options);

    assert.equal(Boolean(issues.devDependencies['package.json']?.[dependency]), unusedDependencies === 1);

    assert.deepEqual(counters, {
      ...baseCounters,
      devDependencies: unusedDependencies,
      processed: 0,
      total: 0,
    });
  });
}

test('Report an unlisted generator dependency from buf.gen.yaml', async () => {
  const cwd = resolve('fixtures/plugins/buf/unlisted');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.ok(issues.unlisted['buf.gen.yaml']?.[dependency]);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: 1,
    processed: 0,
    total: 0,
  });
});

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

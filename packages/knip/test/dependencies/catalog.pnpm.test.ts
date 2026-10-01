import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Should track referenced default catalog entries', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-pnpm');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(!issues.catalog['pnpm-workspace.yaml']['default.left-pad']);
  assert(!issues.catalog['pnpm-workspace.yaml']['default.ms']);
  assert(!issues.catalog['pnpm-workspace.yaml']['default.bar']);
  assert(!issues.catalog['pnpm-workspace.yaml']['default.kleur']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 1,
    processed: 1,
    total: 1,
  });
});

test('Should track referenced named catalog entries', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-named');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.lodash']);
  assert(!issues.catalog['pnpm-workspace.yaml']['frontend.@nu/xt']);
  assert(issues.catalog['pnpm-workspace.yaml']['backend.fastify']);

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 2,
    processed: 1,
    total: 1,
  });
});

test('Should report unused entries and unresolved references independently', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-references');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.catalog['pnpm-workspace.yaml']['default.react']);
  assert(issues.catalog['pnpm-workspace.yaml']['frontend.vue']);
  const defaultReference = issues.catalogReferences['packages/app/package.json']['default.lodash'];
  const namedReference = issues.catalogReferences['packages/app/package.json']['backend.express'];
  const packageOverrideReference = issues.catalogReferences['package.json']['default.missing-package-json'];
  const overrideReference = issues.catalogReferences['pnpm-workspace.yaml']['default.missing'];
  assert.deepEqual({ line: defaultReference.line, col: defaultReference.col }, { line: 4, col: 6 });
  assert.deepEqual({ line: namedReference.line, col: namedReference.col }, { line: 5, col: 6 });
  assert.deepEqual({ line: packageOverrideReference.line, col: packageOverrideReference.col }, { line: 9, col: 8 });
  assert.deepEqual({ line: overrideReference.line, col: overrideReference.col }, { line: 12, col: 3 });

  assert.deepEqual(counters, {
    ...baseCounters,
    catalog: 2,
    catalogReferences: 4,
    processed: 1,
    total: 1,
  });
});

test('Should track dependency and script catalog references outside the selected workspaces', async () => {
  const cwd = resolve('fixtures/dependencies/catalog-workspace-selection');
  const options = await createOptions({ cwd, workspace: '.' });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.catalog, {});
  assert.equal(counters.catalog, 0);
});

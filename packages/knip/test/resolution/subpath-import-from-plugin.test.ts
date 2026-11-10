import assert from 'node:assert/strict';
import test from 'node:test';
import { createGraphExplorer } from '../../src/graph-explorer/explorer.ts';
import { main } from '../../src/index.ts';
import { run } from '../../src/run.ts';
import { join } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/subpath-import-from-plugin');

test('Allows subpath-imports from plugin', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['#missing']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-imports from plugin (production)', async () => {
  const options = await createOptions({ cwd, isProduction: true });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['#missing']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 3,
    total: 3,
  });
});

test('Allows subpath-imports from plugin (strict)', async () => {
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(issues.unresolved['package.json']['#missing']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unresolved: 1,
    processed: 3,
    total: 3,
  });
});

test('Records usage of a package reached through a subpath import (session)', async () => {
  const options = await createOptions({ cwd, isSession: true });
  const { session } = await run(options);

  assert(session);

  const explorer = createGraphExplorer(session.getGraph(), session.getEntryPaths());
  const usage = explorer.getDependencyUsage('dep-pkg').get('dep-pkg');

  assert.deepEqual(
    usage?.imports.map(node => node.filePath),
    [join(cwd, 'package.json')]
  );
});

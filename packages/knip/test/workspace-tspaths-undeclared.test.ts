import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../src/index.ts';
import baseCounters from './helpers/baseCounters.ts';
import { createOptions } from './helpers/create-options.ts';
import { resolve } from './helpers/resolve.ts';

test('import of sibling workspace via tsconfig paths is not unlisted', async () => {
  const cwd = resolve('fixtures/workspace-tspaths-undeclared');
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert(!issues.unlisted['projects/demo/src/index.ts']?.['@scope/fruit']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('strict mode still flags undeclared sibling workspace as unlisted', async () => {
  const cwd = resolve('fixtures/workspace-tspaths-undeclared');
  const options = await createOptions({ cwd, isStrict: true, isProduction: false });
  const { issues } = await main(options);

  assert(issues.unlisted['projects/demo/src/index.ts']?.['@scope/fruit']);
});

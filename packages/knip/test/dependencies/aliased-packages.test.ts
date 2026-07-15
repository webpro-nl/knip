import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/aliased-packages');

test('Attribute imports of npm/jsr/catalog aliased packages to the declared alias', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert.deepEqual(issues.devDependencies, {});
  assert(issues.dependencies['package.json']['plotted-v2']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Report a production import of a dev-only aliased package in strict mode', async () => {
  const options = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']['tinted']);
  assert(!issues.unlisted['index.ts']?.['@org/tinted-lib']);
  assert(!issues.unlisted['index.ts']?.['styled']);
  assert(!issues.unlisted['index.ts']?.['themed']);
});

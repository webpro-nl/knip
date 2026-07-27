import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/dependencies/declaration-dependencies');

test('Use the published declaration graph for dependency placement', async () => {
  const strictOptions = await createOptions({ cwd, isProduction: true, isStrict: true });
  const { issues, counters } = await main(strictOptions);

  assert.deepEqual(Object.keys(issues.dependencies['package.json']), ['unused-production']);
  assert(issues.unlisted['dist/index.d.ts']['misplaced-public']);
  assert(issues.unlisted['dist/index.d.ts']['missing-public']);
  assert(issues.unlisted['dist/index.d.ts']['@types/legacy']);
  assert(issues.unlisted['dist/index.d.ts']['@types/manifest-only']);
  assert(issues.unlisted['dist/index.d.ts']['virtual-public']);
  assert(!issues.unlisted['dist/features/private.d.ts']?.['private-pattern']);
  assert(!issues.unlisted['src/index.ts']?.['private-source']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    unlisted: 5,
    processed: 6,
    total: 6,
  });

  const productionOptions = await createOptions({ cwd, isProduction: true });
  const production = await main(productionOptions);

  assert.deepEqual(Object.keys(production.issues.dependencies['package.json']), ['unused-production']);
  assert.deepEqual(Object.keys(production.issues.unlisted['dist/index.d.ts']), ['missing-public']);
  assert.deepEqual(production.issues.devDependencies, {});

  const strict = await main(await createOptions({ cwd, isStrict: true }));
  assert(strict.issues.unlisted['dist/index.d.ts']['misplaced-public']);
  assert(strict.issues.unlisted['dist/index.d.ts']['missing-public']);
  assert(strict.issues.unlisted['dist/index.d.ts']['@types/legacy']);
  assert(strict.issues.unlisted['dist/index.d.ts']['@types/manifest-only']);
  assert(strict.issues.unlisted['dist/index.d.ts']['virtual-public']);
  assert(!strict.issues.unlisted['dist/features/private.d.ts']?.['private-pattern']);

  const defaults = await main(await createOptions({ cwd }));
  assert.deepEqual(Object.keys(defaults.issues.unlisted['dist/index.d.ts']), ['missing-public']);
});

test('Skip published declaration analysis for private workspaces', async () => {
  const cwd = resolve('fixtures/dependencies/declaration-dependencies-private');
  const { issues, counters } = await main(await createOptions({ cwd, isProduction: true, isStrict: true }));

  assert.deepEqual(issues.unlisted, {});
  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 2,
    total: 2,
  });
});

test('Resolve published declarations without author tsconfig paths', async () => {
  const cwd = resolve('fixtures/dependencies/declaration-tsconfig-paths');
  const { issues } = await main(
    await createOptions({
      cwd,
      isStrict: true,
      includedIssueTypes: ['dependencies', 'unlisted'],
    })
  );

  assert.deepEqual(issues.dependencies, {});
  assert.deepEqual(Object.keys(issues.unlisted['dist/index.d.ts']), ['@types/untyped-lib']);
});

test('Only analyze declarations selected by the published type surface', async () => {
  const cwd = resolve('fixtures/dependencies/declaration-entry-selection');
  const { issues } = await main(
    await createOptions({
      cwd,
      isStrict: true,
      includedIssueTypes: ['dependencies', 'unlisted'],
    })
  );

  assert.deepEqual(issues.dependencies, {});
  assert.deepEqual(issues.unlisted, {});
});

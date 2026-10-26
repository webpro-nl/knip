import assert from 'node:assert/strict';
import test from 'node:test';
import { main } from '../../src/index.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

test('Optional peerDependencies in strict mode should not be reported as unused dependencies', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-strict');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['package.json']?.['pg']);
  assert(!issues.dependencies['package.json']?.['@types/pg']);
  assert(issues.dependencies['package.json']['required-peer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    dependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Unreferenced optional peerDependencies in strict mode should not be reported as unused dependencies', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-strict-unreferenced');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert(!issues.dependencies['package.json']?.['optional-peer']);
  assert(!issues.optionalPeerDependencies['package.json']?.['optional-peer']);

  assert.deepEqual(counters, {
    ...baseCounters,
    processed: 1,
    total: 1,
  });
});

test('Optional peerDependencies imported in try/catch in strict mode should not be reported as unlisted dependencies', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-try-catch');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert(!issues.devDependencies['package.json']?.['@types/pg']);
  assert.equal(counters.optionalPeerDependencies, 1);
  assert.deepEqual(counters, {
    ...baseCounters,
    optionalPeerDependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Optional peerDependencies imported in try/catch should be referenced when the package is not installed', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-try-catch-unresolved');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert.deepEqual(issues.unresolved, {});
  assert.equal(counters.optionalPeerDependencies, 1);
  assert.deepEqual(counters, {
    ...baseCounters,
    optionalPeerDependencies: 1,
    processed: 1,
    total: 1,
  });
});

test('Caught optional peer imports declared in a variable should be accepted in strict mode', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-caught-variable');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert.equal(counters.optionalPeerDependencies, 1);
});

test('Caught optional peer imports in Promise.all should be accepted in strict mode', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-caught-promise-all');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues, counters } = await main(options);

  assert.deepEqual(issues.unlisted, {});
  assert.equal(counters.optionalPeerDependencies, 1);
});

test('A dynamic import nested in Promise.resolve should remain unlisted', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-caught-then');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']?.['optional-peer']);
});

test('A dynamic import passed to an awaited call should remain unlisted', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-caught-call');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']?.['optional-peer']);
});

test('An outer try block should not catch a dynamic import inside a function', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-caught-function');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']?.['optional-peer']);
});

test('Caught dynamic imports that are not declared should remain unlisted when unresolved', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-try-catch-unlisted');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']?.['not-listed']);
});

test('Caught missing relative dynamic imports should remain unresolved', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-try-catch-local-unresolved');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unresolved['index.ts']?.['./missing']);
});

test('Caught optional peer imports should reference their type dependency in default mode', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-try-catch');
  const options = await createOptions({ cwd });
  const { issues } = await main(options);

  assert(!issues.devDependencies['package.json']?.['@types/pg']);
});
test('Optional peerDependencies imported without try/catch in strict mode should be reported as unlisted dependencies', async () => {
  const cwd = resolve('fixtures/dependencies/peer-dependencies-optional-unguarded');
  const options = await createOptions({ cwd, isStrict: true });
  const { issues } = await main(options);

  assert(issues.unlisted['index.ts']?.['optional-peer']);
});

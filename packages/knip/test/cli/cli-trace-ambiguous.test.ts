import assert from 'node:assert/strict';
import test from 'node:test';
import { showDiff } from '../helpers/diff.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports/ambiguous-barrel');

test('knip --trace-export explains ambiguous barrel value exports', () => {
  const actual = exec('knip --trace-export foo --trace-file barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export foo in barrel.ts: competing export * origins in the value namespace
├── fruits.ts:foo
└── vegetables.ts:foo`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export explains ambiguous barrel type exports', () => {
  const actual = exec('knip --trace-export Model --trace-file barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export Model in barrel.ts: competing export * origins in the type namespace
├── fruits.ts:Model
└── vegetables.ts:Model`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export reports collisions in both namespaces', () => {
  const actual = exec('knip --trace-export Entity --trace-file barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export Entity in barrel.ts: competing export * origins in the type and value namespaces
├── fruits.ts:Entity
└── vegetables.ts:Entity`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export limits export type star collisions to the type namespace', () => {
  const actual = exec('knip --trace-export TypeEntity --trace-file type-barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export TypeEntity in type-barrel.ts: competing export * origins in the type namespace
├── fruits.ts:TypeEntity
└── vegetables.ts:TypeEntity`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export still traces a collision origin', () => {
  const actual = exec('knip --trace-export foo --trace-file fruits.ts', { cwd }).stdout;
  const expected = `fruits.ts:foo
└── barrel.ts:reExportStar[foo]
    └── index.ts:import[foo] ⎆ ✓`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export does not forward default through export star', () => {
  assert.equal(
    exec('knip --trace-export default --trace-file default-barrel.ts', { cwd }).stdout,
    'No export default found in default-barrel.ts'
  );
});

test('knip --trace-export reports cross-namespace competitors', () => {
  const actual = exec('knip --trace-export CrossNamespace --trace-file barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export CrossNamespace in barrel.ts: competing export * origins in the type and value namespaces
├── fruits.ts:CrossNamespace
└── vegetables.ts:CrossNamespace`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export keeps copied imports as distinct local bindings', () => {
  const actual = exec('knip --trace-export same --trace-file copy-barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export same in copy-barrel.ts: competing export * origins in the value namespace
├── copy-left.ts:same
└── copy-right.ts:same`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export converges aliases of one local binding through a diamond', () => {
  assert.equal(
    exec('knip --trace-export converged --trace-file alias-barrel.ts', { cwd }).stdout,
    'No export converged found in alias-barrel.ts'
  );
});

test('knip --trace-export converges named default declarations with their local binding', () => {
  assert.equal(
    exec('knip --trace-export namedDefault --trace-file alias-barrel.ts', { cwd }).stdout,
    'No export namedDefault found in alias-barrel.ts'
  );
});

test('knip --trace-export keeps expression defaults distinct from their referenced binding', () => {
  const actual = exec('knip --trace-export expressionDefault --trace-file alias-barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export expressionDefault in alias-barrel.ts: competing export * origins in the value namespace
├── expression-default.ts:default
└── expression-default.ts:apple`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export distinguishes bindings from the same defining module', () => {
  const actual = exec('knip --trace-export split --trace-file alias-barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export split in alias-barrel.ts: competing export * origins in the value namespace
├── bindings.ts:apple
└── bindings.ts:pear`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export converges namespace exports of one module', () => {
  assert.equal(
    exec('knip --trace-export Produce --trace-file namespace-barrel.ts', { cwd }).stdout,
    'No export Produce found in namespace-barrel.ts'
  );
});

test('knip --trace-export gives explicit namespace exports precedence over export star', () => {
  assert.doesNotMatch(
    exec('knip --trace-export fruit --trace-file namespace-explicit-barrel.ts', { cwd }).stdout,
    /^Ambiguous export/
  );
});

test('knip --trace-export distinguishes namespace exports of different modules', () => {
  const actual = exec('knip --trace-export Produce --trace-file namespace-distinct-barrel.ts', { cwd }).stdout;
  const expected = `Ambiguous export Produce in namespace-distinct-barrel.ts: competing export * origins in the type and value namespaces
├── namespace-origin-two.ts:*
└── origin.ts:*`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export gives explicit exports precedence over export star', () => {
  const actual = exec('knip --trace-export fruit --trace-file explicit-barrel.ts', { cwd }).stdout;
  const expected = `explicit-barrel.ts:fruit
└── index.ts:importAs[fruit → winner] ⎆ ✓`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export terminates on ambiguous re-export cycles', () => {
  const actual = exec('knip --trace-export cycleName --trace-file cycle-a.ts', { cwd }).stdout;
  const expected = `Ambiguous export cycleName in cycle-a.ts: competing export * origins in the value namespace
├── cycle-left.ts:cycleName
└── cycle-right.ts:cycleName`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

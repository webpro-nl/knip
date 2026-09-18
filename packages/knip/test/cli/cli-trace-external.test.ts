import assert from 'node:assert/strict';
import test from 'node:test';
import { showDiff } from '../helpers/diff.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/re-exports/external-barrel');

test('knip --trace-export lists an external re-export beside a local definition', () => {
  const actual = exec('knip --trace-export fruit --trace-file ambiguous-barrel.ts', { cwd }).stdout;
  const expected = `ambiguous-barrel.ts:fruit [ambiguous]
├── homegrown-fruit.ts:fruit
└── produce-pkg:fruit`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export converges external re-exports of one package binding', () => {
  assert.equal(
    exec('knip --trace-export fruit --trace-file converged-barrel.ts', { cwd }).stdout,
    'No export fruit found in converged-barrel.ts'
  );
});

test('knip --trace-export keeps the source name of an aliased external re-export', () => {
  const actual = exec('knip --trace-export produce --trace-file aliased-barrel.ts', { cwd }).stdout;
  const expected = `aliased-barrel.ts:produce [ambiguous]
├── homegrown-produce.ts:produce
└── produce-pkg:veggie`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export keeps the source name of an aliased re-export from an uninstalled package', () => {
  const actual = exec('knip --trace-export harvest --trace-file uninstalled-barrel.ts', { cwd }).stdout;
  const expected = `uninstalled-barrel.ts:harvest [ambiguous]
├── homegrown-harvest.ts:harvest
└── orchard-pkg:veggie`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export resolves an imported and re-exported package binding to the package', () => {
  const actual = exec('knip --trace-export fruit --trace-file relayed-barrel.ts', { cwd }).stdout;
  const expected = `relayed-barrel.ts:fruit [ambiguous]
├── homegrown-fruit.ts:fruit
└── produce-pkg:fruit`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

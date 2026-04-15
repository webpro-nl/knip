import assert from 'node:assert/strict';
import test from 'node:test';
import { showDiff } from '../helpers/diff.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/trace');
const nsCwd = resolve('fixtures/ts-namespace');

test('knip --trace', () => {
  const actual = exec('knip --trace', { cwd }).stdout;
  const expected = `require.ts:default
└── (no imports found) ✗
require.ts:resolve
└── barrel.ts:reExportStar[resolve]
    ├── module.ts:importNS[NS.resolve] ✓
    │     refs: [NS.resolve]
    └── shared.ts:reExport[resolve]
shared.ts:CONTAINER
└── module.ts:importAs[CONTAINER → ROOT] ✓
      refs: [ROOT.NS, ROOT.NS.resolve]
shared.ts:resolve
└── (no imports found) ✗
shared.ts:shorten
└── (no imports found) ✗
string.ts:leftPad
└── barrel.ts:reExportNS[STR.leftPad]
    └── module.ts:importNS[NS.STR.leftPad] ✓
          refs: [NS.STR, NS.STR.leftPad]
string.ts:truncate
├── module.ts:import[truncate] ✓
├── module.ts:importAs[truncate → trunc] ✓
├── shared.ts:reExportAs[truncate → shorten]
└── barrel.ts:reExportNS[STR.truncate]
    └── module.ts:importNS[NS.STR.truncate] ✓
          refs: [NS.STR, NS.STR.truncate]`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export shows namespace member statuses', () => {
  const actual = exec('knip --trace-export Fruits --trace-file members.ts', { cwd: nsCwd }).stdout;
  const expected = `members.ts:Fruits
└── index.ts:import[Fruits] ⎆ ✓
      refs: [Fruits.apple, Fruits.Tropical, Fruits.Tropical.mango]
    members: [apple ✓, unusedBanana ✗, Tropical.mango ✓, Tropical.unusedPapaya ✗]`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export resolves dotted namespace member', () => {
  const actual = exec('knip --trace-export Fruits.apple --trace-file members.ts', { cwd: nsCwd }).stdout;
  const expected = `members.ts:Fruits
└── index.ts:import[Fruits] ⎆ ✓
      refs: [Fruits.apple, Fruits.Tropical, Fruits.Tropical.mango]
    members: [apple ✓, unusedBanana ✗, Tropical.mango ✓, Tropical.unusedPapaya ✗]`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

test('knip --trace-export shows hasRefsInFile for forward-referenced members', () => {
  const actual = exec('knip --trace-export Seasons --trace-file members.ts', { cwd: nsCwd }).stdout;
  const expected = `members.ts:Seasons
└── index.ts:import[Seasons] ⎆ ✓
    members: [Name ✓, getName ✓, unusedCount ✗]`;

  if (actual !== expected) {
    showDiff(actual, expected);
    assert.fail('Output mismatch (see diff above)');
  }
});

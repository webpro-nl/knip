import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/trace');

test('knip --trace', () => {
  const actual = exec('knip --trace', { cwd }).stdout;
  const expected = `require.ts:resolve
└── barrel.ts:reExportStar[resolve]
    ├── module.ts:importNS[NS.resolve] ✓
    │     refs: [NS.resolve]
    └── shared.ts:reExport[resolve]
require.ts:default
└── (no imports found) ✗
string.ts:truncate
├── module.ts:import[truncate] ✓
├── module.ts:importAs[truncate → trunc] ✓
├── shared.ts:reExportAs[truncate → shorten]
└── barrel.ts:reExportNS[STR.truncate]
    └── module.ts:importNS[NS.STR.truncate] ✓
          refs: [NS.STR, NS.STR.truncate]
string.ts:leftPad
└── barrel.ts:reExportNS[STR.leftPad]
    └── module.ts:importNS[NS.STR.leftPad] ✓
          refs: [NS.STR, NS.STR.leftPad]
shared.ts:resolve
└── (no imports found) ✗
shared.ts:shorten
└── (no imports found) ✗
shared.ts:CONTAINER
└── module.ts:importAs[CONTAINER → ROOT] ✓
      refs: [ROOT.NS, ROOT.NS.resolve]`;
  assert.equal(actual, expected);
});

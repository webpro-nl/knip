import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { Table } from '../../src/util/table.js';

test('table with column gaps and truncated values', () => {
  const table = new Table({ maxWidth: 72, truncateStart: ['col-2'] });
  table.newRow();
  table.cell('col-1', '../../runtime/client/idle.prebuilt.js');
  table.cell('col-2', 'packages/astro/src/core/client-directive/default.ts:1:25');
  table.newRow();
  table.cell('col-1', '../../runtime/client/visible.prebuilt.js');
  table.cell('col-2', 'packages/astro/src/core/client-directive/default.ts:5:28');

  const expected = `
../../runtime/client/idle.p...  ...core/client-directive/default.ts:1:25
../../runtime/client/visibl...  ...core/client-directive/default.ts:5:28`;

  const output = table.toString();
  assert.equal(expected.trimStart(), output);
  assert.equal(output.split('\n')[0].length, 72);
});

test('table with no- and start-truncated values', () => {
  const table = new Table({ maxWidth: 72, noTruncate: ['col-3'], truncateStart: ['col-4'] });
  table.newRow();
  table.cell('col-1', 'renderFontFace');
  table.cell('col-2', undefined);
  table.cell('col-3', 'function');
  table.cell('col-4', 'packages/astro/src/assets/fonts/implementations/css-renderer.ts:15:17');
  table.newRow();
  table.cell('col-1', 'telemetryNotice');
  table.cell('col-2', 'msg');
  table.cell('col-3', undefined);
  table.cell('col-4', 'packages/astro/src/core/messages.ts:123:17');
  table.newRow();
  table.cell('col-1', 'normalizeInjectedTypeFilename');
  table.cell('col-2', undefined);
  table.cell('col-3', 'function');
  table.cell('col-4', 'packages/astro/src/integrations/hooks.ts:157:17');

  const expected = `
renderFontFace           function  ...lementations/css-renderer.ts:15:17
telemetryNotice     msg            .../astro/src/core/messages.ts:123:17
normalizeInject...       function  ...o/src/integrations/hooks.ts:157:17`;

  const output = table.toString();
  assert.equal(expected.trimStart(), output);
  assert.equal(output.split('\n')[0].length, 72);
  assert.equal(output.split('\n')[1].length, 72);
  assert.equal(output.split('\n')[2].length, 72);
});

test('table with header', () => {
  const table = new Table({ header: true });
  table.newRow();
  table.cell('A', 'A1');
  table.cell('B', 'B1');
  table.cell('C', 1);
  table.newRow();
  table.cell('A', 'A2');
  table.cell('B', 'B2');
  table.cell('C', 2);

  const expected = `
A   B   C
--  --  -
A1  B1  1
A2  B2  2`;

  const output = table.toString();
  assert.equal(expected.trimStart(), output);
});

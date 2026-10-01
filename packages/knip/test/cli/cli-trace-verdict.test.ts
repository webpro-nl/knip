import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

test('trace marks an entry-reexported (public) export as referenced, not unused', () => {
  const cwd = resolve('fixtures/entry/include-entry-reexports');
  const actual = exec('knip --trace', { cwd }).stdout;
  assert.match(actual, /module-b\.mjs:identifierB\n└── \(no imports found\) ✓/);
  assert.doesNotMatch(actual, /identifierB\n└── \(no imports found\) ✗/);
});

test('trace marks a reported namespace-export as unused', () => {
  const cwd = resolve('fixtures/imports/namespace-with-nsexports');
  const actual = exec('knip --trace-export identifier31 --trace-file namespace3.ts', { cwd }).stdout;
  assert.equal(actual, 'namespace3.ts:identifier31\n└── (no imports found) ✗');
});

test('trace member markers match the report (whole-enum reference keeps members used)', () => {
  const cwd = resolve('fixtures/types/enum-members');
  const category = exec('knip --trace-export Category --trace-file members.ts', { cwd }).stdout;
  assert.match(category, /members: \[Ambient ✓, Playback ✓\]/);
  const myEnum = exec('knip --trace-export MyEnum --trace-file members.ts', { cwd }).stdout;
  assert.match(myEnum, /members: \[A_UsedExternal ✓, B_Unused ✗, C_UsedInternal ✓, D-Key ✗\]/);
});

test('trace marks re-export leaves and distinguishes unused from @knipignore-tagged', () => {
  const cwd = resolve('fixtures/namespaces/barrel-namespace-chain');
  const unused = exec('knip --trace-export unusedExport --trace-file protocol.ts', { cwd }).stdout;
  assert.match(unused, /lib\.ts:reExportNS\[server\.protocol\.unusedExport\] ✗/);
  const tagged = exec('knip --trace-export taggedExport --trace-file protocol.ts', { cwd }).stdout;
  assert.match(tagged, /lib\.ts:reExportNS\[server\.protocol\.taggedExport\] ✓/);
});

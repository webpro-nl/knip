import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/trace');

test('knip --trace-dependency reports no match', () => {
  assert.equal(
    exec('knip --trace-dependency __does_not_exist__', { cwd }).stdout,
    'No imports found matching __does_not_exist__'
  );
});

test('knip --trace-export reports no match', () => {
  assert.equal(exec('knip --trace-export __nope__', { cwd }).stdout, 'No export __nope__ found');
});

test('knip --trace-export reports no match in a given file', () => {
  assert.equal(
    exec('knip --trace-export resolve --trace-file string.ts', { cwd }).stdout,
    'No export resolve found in string.ts'
  );
});

test('knip --trace-file reports a missing file', () => {
  assert.equal(
    exec('knip --trace-file does-not-exist.ts', { cwd }).stdout,
    'File not found in module graph: does-not-exist.ts'
  );
});

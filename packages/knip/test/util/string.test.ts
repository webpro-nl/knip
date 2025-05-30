import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { pad, truncate, truncateStart } from '../../src/util/string.js';

test('truncate', () => {
  assert.equal(truncate('hello world', 8), 'hello w…');
  assert.equal(truncate('short', 8), 'short');
  assert.equal(truncate('\u001b[31mred\u001b[0m text', 5), '\u001b[31mred\u001b[0m …');
  assert.equal(truncate('\u001b[31mlong red text\u001b[0m', 8), '\u001b[31mlong re…\u001b[0m');
});

test('truncateStart', () => {
  assert.equal(truncateStart('hello world', 8), '…o world');
  assert.equal(truncateStart('short', 8), 'short');
  assert.equal(truncateStart('\u001b[31mred\u001b[0m text', 7), '\u001b[31m…d\u001b[0m text');
  assert.equal(truncateStart('\u001b[31mlong red text\u001b[0m', 8), '\u001b[31m…ed text\u001b[0m');
});

test('pad right', () => {
  assert.equal(pad('test', 8, '-', 'right'), '----test');
  assert.equal(pad('\u001b[31mred\u001b[0m', 8, '-', 'right'), '-----\u001b[31mred\u001b[0m');
});

test('pad center', () => {
  assert.equal(pad('test', 8, '-', 'center'), '--test--');
  assert.equal(pad('\u001b[31mred\u001b[0m', 8, '-', 'center'), '--\u001b[31mred\u001b[0m---');
});

test('pad left', () => {
  assert.equal(pad('test', 8, '-'), 'test----');
  assert.equal(pad('\u001b[31mred\u001b[0m', 8, '-'), '\u001b[31mred\u001b[0m-----');
});

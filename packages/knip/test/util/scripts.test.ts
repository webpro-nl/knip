import assert from 'node:assert/strict';
import test from 'node:test';
import { getScriptCommands } from '../../src/util/scripts.ts';

test('getScriptCommands splits chained commands', () => {
  assert.deepEqual(getScriptCommands('bun run build && bun test'), [
    { binary: 'bun', args: ['run', 'build'] },
    { binary: 'bun', args: ['test'] },
  ]);
});

test('getScriptCommands keeps options with their command', () => {
  assert.deepEqual(getScriptCommands('bun --config=x test ./a'), [
    { binary: 'bun', args: ['--config=x', 'test', './a'] },
  ]);
});

test('getScriptCommands unwraps spawning binaries', () => {
  assert.deepEqual(getScriptCommands('cross-env NODE_ENV=test bun test'), [{ binary: 'bun', args: ['test'] }]);
  assert.deepEqual(getScriptCommands('retry-cli -- node --test'), [{ binary: 'node', args: ['--test'] }]);
});

test('getScriptCommands normalizes binary paths', () => {
  assert.deepEqual(getScriptCommands('./node_modules/.bin/bun test'), [{ binary: 'bun', args: ['test'] }]);
});

test('getScriptCommands returns an empty array for empty or unparseable scripts', () => {
  assert.deepEqual(getScriptCommands(''), []);
});

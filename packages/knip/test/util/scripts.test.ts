import assert from 'node:assert/strict';
import test from 'node:test';
import { getScriptCommands, toShellCommand } from '../../src/util/scripts.ts';

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
  assert.deepEqual(getScriptCommands('c8 node --test'), [{ binary: 'node', args: ['--test'] }]);
});

test('getScriptCommands keeps quoted arguments of spawning binaries intact', () => {
  assert.deepEqual(getScriptCommands('cross-env FLAGS="-a;-b" bun test --filter="unit;fast"'), [
    { binary: 'bun', args: ['test', '--filter=unit;fast'] },
  ]);
});

test('getScriptCommands normalizes binary paths', () => {
  assert.deepEqual(getScriptCommands('./node_modules/.bin/bun test'), [{ binary: 'bun', args: ['test'] }]);
});

test('getScriptCommands returns an empty array for empty or unparseable scripts', () => {
  assert.deepEqual(getScriptCommands(''), []);
});

test('toShellCommand round-trips argv through the script parser', () => {
  const t = (argv: string[]) =>
    assert.deepEqual(getScriptCommands(toShellCommand(argv)), [{ binary: argv[0], args: argv.slice(1) }]);

  t(['node', 'lib/server.js']);
  t(['node', '--title=mdx content mapper', 'lib/server.js']);
  t(['node', 'lib/server.js; rm -rf tmp']);
  t(['node', '$HOME/server.js']);
  t(['node', "it's/server.js"]);
  t(['node', 'lib/*.js']);
});

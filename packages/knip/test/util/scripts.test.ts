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

test('getScriptCommands excludes redirects from arguments', () => {
  assert.deepEqual(getScriptCommands('>output.log node 2>errors.log ./script.js <input.txt'), [
    { binary: 'node', args: ['./script.js'] },
  ]);
  assert.deepEqual(getScriptCommands('cross-env >output.log NODE_ENV=test node ./script.js'), [
    { binary: 'node', args: ['./script.js'] },
  ]);
});

test('getScriptCommands traverses shell command wrappers', () => {
  assert.deepEqual(getScriptCommands('time -p ! { node ./script.js; } >output.log'), [
    { binary: 'node', args: ['./script.js'] },
  ]);
  assert.deepEqual(getScriptCommands('time'), []);
  assert.deepEqual(getScriptCommands('!'), []);
});

test('getScriptCommands traverses elif branches', () => {
  assert.deepEqual(
    getScriptCommands('if a; then b; elif c; then d; else e; fi').map(command => command.binary),
    ['a', 'b', 'c', 'd', 'e']
  );
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

test('getScriptCommands returns an empty array for empty scripts and recovers from over-deep syntax', () => {
  assert.deepEqual(getScriptCommands(''), []);
  const deep = `$((${'('.repeat(300)}1${')'.repeat(300)}))`;
  assert.deepEqual(getScriptCommands(`echo ${deep}`), [{ binary: 'echo', args: [deep] }]);
});

test('getScriptCommands reaches commands in every compound body', () => {
  assert.deepEqual(getScriptCommands('case $1 in start) node ./start.js;; *) node ./other.js;; esac'), [
    { binary: 'node', args: ['./start.js'] },
    { binary: 'node', args: ['./other.js'] },
  ]);
  assert.deepEqual(getScriptCommands('for (( i = 0; i < 3; i++ )); do node ./script.js; done'), [
    { binary: 'node', args: ['./script.js'] },
  ]);
});

test('getScriptCommands keeps substitution scripts out of the enclosing script', () => {
  assert.deepEqual(getScriptCommands('echo $(node ./script.js) <(node ./other.js) >$(node ./target.js)'), [
    { binary: 'echo', args: ['$(node ./script.js)', '<(node ./other.js)'] },
  ]);
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

import assert from 'node:assert/strict';
import test from 'node:test';
import parseArgs from '../../src/util/parse-args.ts';

test('parseArgs (positionals)', () => {
  assert.deepEqual(parseArgs(['a', 'b']), { _: ['a', 'b'] });
  assert.deepEqual(parseArgs([]), { _: [] });
  assert.deepEqual(parseArgs(['a', '--flag', 'b'])._, ['a']);
});

test('parseArgs (greedy value consumption for undeclared options)', () => {
  assert.deepEqual(parseArgs(['--package', '@scope/pkg', 'cmd']), { _: ['cmd'], package: '@scope/pkg' });
  assert.deepEqual(parseArgs(['-p', 'pkg'], { alias: { package: 'p' } }), { _: [], p: 'pkg', package: 'pkg' });
  assert.equal(parseArgs(['--require', 'pkg', 'script.js']).require, 'pkg');
});

test('parseArgs (short flag bundles)', () => {
  assert.deepEqual(parseArgs(['-abc']), { _: [], a: true, b: true, c: true });
  assert.deepEqual(parseArgs(['-pfoo']), { _: [], p: true, f: true, o: true });
});

test('parseArgs (short option with inline equals)', () => {
  assert.deepEqual(parseArgs(['-p=plugin'], { alias: { plugin: 'p' } }), { _: [], p: 'plugin', plugin: 'plugin' });
});

test('parseArgs (declared string defaults to empty when no value)', () => {
  assert.deepEqual(parseArgs(['--cwd'], { string: ['cwd'] }), { _: [], cwd: '' });
});

test('parseArgs (booleans)', () => {
  assert.deepEqual(parseArgs(['--quiet'], { boolean: ['quiet'] }), { _: [], quiet: true });
  assert.deepEqual(parseArgs([], { boolean: ['quiet'] }), { _: [], quiet: false });
  assert.deepEqual(parseArgs(['--quiet', 'x'], { boolean: ['quiet'] }), { _: ['x'], quiet: true });
  assert.deepEqual(parseArgs(['--quiet=false'], { boolean: ['quiet'] }), { _: [], quiet: false });
});

test('parseArgs (repeated options accumulate into arrays)', () => {
  assert.deepEqual(parseArgs(['--foo', 'a', '--foo', 'b'], { string: ['foo'] }), { _: [], foo: ['a', 'b'] });
});

test('parseArgs (multi-aliases mirror and share one slot)', () => {
  const parsed = parseArgs(['--require=a', '--require', 'b', 'script'], {
    string: ['r'],
    alias: { require: ['r', 'loader', 'import'] },
  });
  assert.deepEqual(parsed._, ['script']);
  for (const key of ['require', 'r', 'loader', 'import']) assert.deepEqual(parsed[key], ['a', 'b']);
});

test('parseArgs (alias value accumulates across canonical and short forms)', () => {
  const parsed = parseArgs(['--package=a', '-p', 'b', 'dlx', 'pkg'], { alias: { package: 'p' } });
  assert.deepEqual(parsed._, ['dlx', 'pkg']);
  assert.deepEqual(parsed.package, ['a', 'b']);
  assert.deepEqual(parsed.p, ['a', 'b']);
});

test('parseArgs (dotted options nest into objects)', () => {
  assert.deepEqual(parseArgs(['--coverage.provider=v8']), { _: [], coverage: { provider: 'v8' } });
  assert.deepEqual(parseArgs(['--typecheck.checker', 'tsc']), { _: [], typecheck: { checker: 'tsc' } });
  assert.deepEqual(parseArgs(['--a.b=1', '--a.c=2'])._, []);
  assert.deepEqual(parseArgs(['--a.b=1', '--a.c=2']).a, { b: '1', c: '2' });
});

test('parseArgs (double-dash capture with "--": true)', () => {
  assert.deepEqual(parseArgs(['run', 'build', '--', 'node', 'x.js'], { '--': true }), {
    _: ['run', 'build'],
    '--': ['node', 'x.js'],
  });
  assert.deepEqual(parseArgs(['run', '--'], { '--': true }), { _: ['run'], '--': [] });
  assert.deepEqual(parseArgs(['run', 'build'], { '--': true }), { _: ['run', 'build'], '--': [] });
});

test('parseArgs (double-dash without "--" folds into positionals)', () => {
  assert.deepEqual(parseArgs(['--no', '--', 'pkg', '--edit'], { boolean: ['no'] }), {
    _: ['pkg', '--edit'],
    no: true,
  });
});

test('parseArgs (tolerates non-string args like minimist)', () => {
  // node:util.parseArgs throws on undefined elements; minimist and this adapter skip them
  assert.deepEqual(parseArgs(['-c', undefined as unknown as string], { string: ['config'], alias: { config: 'c' } }), {
    _: [],
    c: '',
    config: '',
  });
});

test('parseArgs (does not mutate inputs)', () => {
  const argv = ['-y', 'pkg'];
  const opts = { boolean: ['yes'], alias: { yes: 'y' } };
  parseArgs(argv, opts);
  assert.deepEqual(argv, ['-y', 'pkg']);
  assert.deepEqual(opts, { boolean: ['yes'], alias: { yes: 'y' } });
});

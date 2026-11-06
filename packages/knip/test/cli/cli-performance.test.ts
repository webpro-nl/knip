import assert from 'node:assert/strict';
import test from 'node:test';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/config-json');

test('Select plugin timings without enabling every performance timer', () => {
  const { stdout, stderr, status } = exec(['--performance-fn', 'resolve (Node.js)'], { cwd });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  assert.match(stdout, /resolve \(Node\.js\)/);
  assert.doesNotMatch(stdout, /walkAndAnalyze/);
});

test('Report run time with additional startup time without function instrumentation', () => {
  const { stdout, stderr, status } = exec('knip --duration', { cwd });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  assert.match(stdout, /^Total running time: \S+ \(\+\S+ startup\)$/);
  assert.doesNotMatch(stdout, /walkAndAnalyze/);
});

test('Measure configuration and analysis phases independently', () => {
  const names = ['loadResolvedConfigFile', 'parseConfiguration', 'createOptions', 'build', 'analyzeGraph'];
  const args: string[] = [];
  for (const name of names) args.push('--performance-fn', name);
  const { stdout, stderr, status } = exec(args, { cwd });
  assert.equal(status, 0);
  assert.equal(stderr, '');
  for (const name of names) assert.ok(stdout.includes(name), name);
  assert.doesNotMatch(stdout, /walkAndAnalyze/);
});

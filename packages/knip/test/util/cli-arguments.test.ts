import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { parseNumericOption } from '../../src/util/cli-arguments.ts';
import { ConfigurationError } from '../../src/util/errors.ts';
import { resolve } from '../helpers/resolve.ts';

test('parseNumericOption returns non-negative integers', () => {
  assert.equal(parseNumericOption('0', 'max-issues'), 0);
  assert.equal(parseNumericOption('10', 'max-issues'), 10);
});

test('parseNumericOption returns undefined for an absent value', () => {
  assert.equal(parseNumericOption(undefined, 'max-issues'), undefined);
});

test('parseNumericOption rejects non-numeric values with the option name', () => {
  assert.throws(
    () => parseNumericOption('abc', 'max-show-issues'),
    error => error instanceof ConfigurationError && error.message.includes('--max-show-issues')
  );
});

test('parseNumericOption rejects negative integers', () => {
  assert.throws(() => parseNumericOption('-1', 'max-issues'), ConfigurationError);
});

test('parseNumericOption rejects fractional values', () => {
  assert.throws(() => parseNumericOption('3.5', 'max-issues'), ConfigurationError);
});

test('parseNumericOption rejects an empty value', () => {
  assert.throws(() => parseNumericOption('', 'max-issues'), ConfigurationError);
});

test('invalid --max-issues does not disable the exit-code gate', () => {
  const result = spawnSync(process.execPath, [resolve('src/cli.ts'), '--max-issues=abc', '--reporter', 'compact'], {
    cwd: resolve('fixtures/compact-reporter'),
    env: { PATH: process.env.PATH, NO_COLOR: '1' },
  });

  assert.match(result.stderr.toString(), /Option --max-issues expects a non-negative integer, got: abc/);
  assert.equal(result.status, 2);
});

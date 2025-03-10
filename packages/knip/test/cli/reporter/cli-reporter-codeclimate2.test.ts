import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

const exec = execFactory(cwd);

test('knip --reporter codeclimate (files, unlisted & unresolved)', () => {
  const json = [
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: 'unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: 'b1b545760301bdc48bed7e04d45efc78',
    },
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: '@org/unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: 'ada204238b38158fad8bff20699311d2',
    },
    {
      type: 'issue',
      check_name: 'Unresolved imports',
      description: './unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 8, column: 23 } } },
      severity: 'major',
      fingerprint: '848e2712798120c3a315e9880c516093',
    },
  ];

  assert.equal(exec('knip --reporter codeclimate').stdout, `${JSON.stringify(json)}\n`);
});

import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { assertAndRemoveProperty } from '../../helpers/assertAndRemoveProperty.js';
import { exec } from '../../helpers/exec.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter codeclimate (files, unlisted & unresolved)', () => {
  const json = [
    {
      categories: ['Bug Risk'],
      check_name: 'Unused files',
      description: 'Unused file: src/unused.ts',
      location: { path: 'src/unused.ts', lines: { begin: 0, end: 0 } },
      severity: 'major',
      type: 'issue',
    },
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: 'Unlisted dependency: unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', lines: { begin: 0, end: 0 } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: 'Unlisted dependency: @org/unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', lines: { begin: 0, end: 0 } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unresolved imports',
      description: 'Unresolved import: ./unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 8, column: 23 }, end: { line: 8, column: 23 } } },
      severity: 'major',
    },
  ];

  const issues = JSON.parse(exec('knip --reporter codeclimate', { cwd }).stdout) as {
    fingerprint: string;
    [key: string]: unknown;
  }[];

  const issuesWithoutFingerprints = issues.map(issue => {
    return assertAndRemoveProperty(issue, 'fingerprint', fingerprint => assert.match(fingerprint, /[a-f0-9]{32}/));
  });

  assert.deepEqual(issuesWithoutFingerprints, json);
});

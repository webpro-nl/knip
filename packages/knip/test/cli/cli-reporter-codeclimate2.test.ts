import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { Issue } from 'codeclimate-types';
import { assertAndRemoveFingerprint, orderByPos } from '../helpers/assertAndRemoveProperty.js';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/module-resolution-non-std');

test('knip --reporter codeclimate (files, unlisted & unresolved)', () => {
  const json: Issue[] = [
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
      location: { path: 'src/index.ts', positions: { begin: { line: 9, column: 27 }, end: { line: 9, column: 27 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: 'Unlisted dependency: @org/unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 10, column: 27 }, end: { line: 10, column: 27 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unresolved imports',
      description: 'Unresolved import: ./unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 8, column: 24 }, end: { line: 8, column: 24 } } },
      severity: 'major',
    },
  ];

  const issues: Issue[] = JSON.parse(exec('knip --reporter codeclimate', { cwd }).stdout);

  const issuesWithoutFingerprints = issues.map(assertAndRemoveFingerprint);

  assert.deepEqual(issuesWithoutFingerprints.sort(orderByPos), json.sort(orderByPos));
});

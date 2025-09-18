import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { Issue } from 'codeclimate-types';
import { assertAndRemoveFingerprint, orderByPos } from '../helpers/assertAndRemoveProperty.js';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/dependencies');

test('knip --reporter codeclimate (dependencies)', () => {
  const json: Issue[] = [
    {
      categories: ['Bug Risk'],
      check_name: 'Unused files',
      description: 'Unused file: unused-module.ts',
      location: { path: 'unused-module.ts', lines: { begin: 0, end: 0 } },
      severity: 'major',
      type: 'issue',
    },
    {
      type: 'issue',
      check_name: 'Unused dependencies',
      description: 'Unused dependency: @tootallnate/once',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 8, column: 6 }, end: { line: 8, column: 6 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused dependencies',
      description: 'Unused dependency: fs-extra',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 10, column: 6 }, end: { line: 10, column: 6 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused devDependencies',
      description: 'Unused devDependency: mocha',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 23, column: 6 }, end: { line: 23, column: 6 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'Unlisted binary: jest',
      categories: ['Bug Risk'],
      location: { path: 'package.json', lines: { begin: 0, end: 0 } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'Unlisted binary: start-server',
      categories: ['Bug Risk'],
      location: { path: 'package.json', lines: { begin: 0, end: 0 } },
      severity: 'major',
    },
  ];

  const issues: Issue[] = JSON.parse(exec('knip --reporter codeclimate', { cwd }).stdout);

  const issuesWithoutFingerprints = issues.map(assertAndRemoveFingerprint);

  assert.deepEqual(issuesWithoutFingerprints.sort(orderByPos), json.sort(orderByPos));
});

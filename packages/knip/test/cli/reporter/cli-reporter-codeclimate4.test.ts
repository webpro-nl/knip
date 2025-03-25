import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { assertAndRemoveProperty } from '../../helpers/assertAndRemoveProperty.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/dependencies');

const exec = execFactory(cwd);

test('knip --reporter codeclimate (dependencies)', () => {
  const json = [
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

  const issues = JSON.parse(exec('knip --reporter codeclimate').stdout) as {
    fingerprint: string;
    [key: string]: unknown;
  }[];

  const issuesWithoutFingerprints = issues.map(issue => {
    return assertAndRemoveProperty(issue, 'fingerprint', fingerprint => assert.match(fingerprint, /[a-f0-9]{32}/));
  });

  assert.deepEqual(issuesWithoutFingerprints, json);
});

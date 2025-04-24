import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { assertAndRemoveProperty } from '../../helpers/assertAndRemoveProperty.js';
import { exec } from '../../helpers/exec.js';

const cwd = resolve('fixtures/enum-members');

test('knip --reporter codeclimate (enum members)', () => {
  const json = [
    {
      type: 'issue',
      check_name: 'Unused exported enum members',
      description: 'Unused exported enum member: B_Unused (MyEnum)',
      categories: ['Bug Risk'],
      location: { path: 'members.ts', positions: { begin: { line: 9, column: 3 }, end: { line: 9, column: 3 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exported enum members',
      description: 'Unused exported enum member: D-Key (MyEnum)',
      categories: ['Bug Risk'],
      location: { path: 'members.ts', positions: { begin: { line: 11, column: 3 }, end: { line: 11, column: 3 } } },
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

import { test } from 'bun:test';
import assert from 'node:assert/strict';
import type { Issue } from 'codeclimate-types';
import { assertAndRemoveFingerprint, orderByPos } from '../helpers/assertAndRemoveProperty.js';
import { exec } from '../helpers/exec.js';
import { resolve } from '../helpers/resolve.js';

const cwd = resolve('fixtures/enum-members');

test('knip --reporter codeclimate (enum members)', () => {
  const json: Issue[] = [
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

  const issues: Issue[] = JSON.parse(exec('knip --reporter codeclimate', { cwd }).stdout);

  const issuesWithoutFingerprints = issues.map(assertAndRemoveFingerprint);

  assert.deepEqual(issuesWithoutFingerprints.sort(orderByPos), json.sort(orderByPos));
});

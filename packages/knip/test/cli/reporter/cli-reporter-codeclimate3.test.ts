import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/enum-members');

const exec = execFactory(cwd);

test('knip --reporter codeclimate (enum members)', () => {
  const json = [
    {
      type: 'issue',
      check_name: 'Unused exported enum members',
      description: 'B_Unused (MyEnum)',
      categories: ['Bug Risk'],
      location: { path: 'members.ts', positions: { begin: { line: 9, column: 3 } } },
      severity: 'major',
      fingerprint: '784fc56ef59f32b5a65c79285b011268',
    },
    {
      type: 'issue',
      check_name: 'Unused exported enum members',
      description: 'D_Key (MyEnum)',
      categories: ['Bug Risk'],
      location: { path: 'members.ts', positions: { begin: { line: 11, column: 3 } } },
      severity: 'major',
      fingerprint: '56c0c3061c62aba497eef68826c072b0',
    },
  ];

  assert.equal(exec('knip --reporter codeclimate').stdout, `${JSON.stringify(json)}\n`);
});

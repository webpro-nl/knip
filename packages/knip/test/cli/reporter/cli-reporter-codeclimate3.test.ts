import { expect, test } from 'bun:test';
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
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unused exported enum members',
      description: 'D_Key (MyEnum)',
      categories: ['Bug Risk'],
      location: { path: 'members.ts', positions: { begin: { line: 11, column: 3 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
  ];

  const actual = JSON.parse(exec('knip --reporter codeclimate').stdout);

  expect(actual).toStrictEqual(json);
});

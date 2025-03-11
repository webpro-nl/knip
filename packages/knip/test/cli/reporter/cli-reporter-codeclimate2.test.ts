import { expect, test } from 'bun:test';
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
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unlisted dependencies',
      description: '@org/unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unresolved imports',
      description: './unresolved',
      categories: ['Bug Risk'],
      location: { path: 'src/index.ts', positions: { begin: { line: 8, column: 23 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
  ];

  const actual = JSON.parse(exec('knip --reporter codeclimate').stdout);

  expect(actual).toStrictEqual(json);
});

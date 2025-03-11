import { expect, test } from 'bun:test';
import { resolve } from '../../../src/util/path.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/dependencies');

const exec = execFactory(cwd);

test('knip --reporter codeclimate (dependencies)', () => {
  const json = [
    {
      type: 'issue',
      check_name: 'Unused dependencies',
      description: '@tootallnate/once',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 8, column: 6 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unused dependencies',
      description: 'fs-extra',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 10, column: 6 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unused devDependencies',
      description: 'mocha',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 23, column: 6 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'jest',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'start-server',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: expect.any(String),
    },
  ];

  const actual = JSON.parse(exec('knip --reporter codeclimate').stdout);

  expect(actual).toStrictEqual(json);
});

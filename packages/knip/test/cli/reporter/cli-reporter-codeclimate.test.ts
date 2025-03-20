import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
import { assertAndRemoveProperty } from '../../helpers/assertAndRemoveProperty.js';
import { execFactory } from '../../helpers/exec.js';

const cwd = resolve('fixtures/exports');

const exec = execFactory(cwd);

test('knip --reporter codeclimate (exports & types)', () => {
  const json = [
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedNumber',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 23, column: 14 }, end: { line: 23, column: 14 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedFunction',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 24, column: 14 }, end: { line: 24, column: 14 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'default',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 30, column: 8 }, end: { line: 30, column: 8 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'renamedExport',
      categories: ['Bug Risk'],
      location: {
        path: 'named-exports.ts',
        positions: { begin: { line: 6, column: 30 }, end: { line: 6, column: 30 } },
      },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'namedExport',
      categories: ['Bug Risk'],
      location: {
        path: 'named-exports.ts',
        positions: { begin: { line: 7, column: 15 }, end: { line: 7, column: 15 } },
      },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedZero',
      categories: ['Bug Risk'],
      location: {
        path: 'dynamic-import.ts',
        positions: { begin: { line: 3, column: 14 }, end: { line: 3, column: 14 } },
      },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedInMix',
      categories: ['Bug Risk'],
      location: { path: 'my-mix.ts', positions: { begin: { line: 1, column: 14 }, end: { line: 1, column: 14 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'NamedExport',
      categories: ['Bug Risk'],
      location: { path: 'default.ts', positions: { begin: { line: 1, column: 14 }, end: { line: 1, column: 14 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'nsUnusedKey (MyNamespace)',
      categories: ['Bug Risk'],
      location: {
        path: 'my-namespace.ts',
        positions: { begin: { line: 3, column: 14 }, end: { line: 3, column: 14 } },
      },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyAnyType',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 28, column: 13 }, end: { line: 28, column: 13 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyEnum',
      categories: ['Bug Risk'],
      location: { path: 'types.ts', positions: { begin: { line: 3, column: 13 }, end: { line: 3, column: 13 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyType',
      categories: ['Bug Risk'],
      location: { path: 'types.ts', positions: { begin: { line: 8, column: 14 }, end: { line: 8, column: 14 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyNamespace (MyNamespace)',
      categories: ['Bug Risk'],
      location: {
        path: 'my-namespace.ts',
        positions: { begin: { line: 5, column: 18 }, end: { line: 5, column: 18 } },
      },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Duplicate exports',
      description: 'exportedResult',
      categories: ['Duplication'],
      location: { path: 'my-module.ts', positions: { begin: { line: 26, column: 13 }, end: { line: 26, column: 13 } } },
      severity: 'major',
    },
    {
      type: 'issue',
      check_name: 'Duplicate exports',
      description: 'default',
      categories: ['Duplication'],
      location: { path: 'my-module.ts', positions: { begin: { line: 30, column: 15 }, end: { line: 30, column: 15 } } },
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

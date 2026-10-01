import assert from 'node:assert/strict';
import test from 'node:test';
import type { Issue } from 'codeclimate-types';
import { assertAndRemoveFingerprint, orderByPos } from '../helpers/assertAndRemoveProperty.ts';
import { exec } from '../helpers/exec.ts';
import { resolve } from '../helpers/resolve.ts';

const cases: { desc: string; cwd: string; expected: Issue[] }[] = [
  {
    desc: 'exports & types',
    cwd: 'fixtures/exports/basic',
    expected: [
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: unusedNumber',
        categories: ['Bug Risk'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 23, column: 14 }, end: { line: 23, column: 14 } },
        },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: unusedFunction',
        categories: ['Bug Risk'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 24, column: 14 }, end: { line: 24, column: 14 } },
        },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: default',
        categories: ['Bug Risk'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 30, column: 16 }, end: { line: 30, column: 16 } },
        },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: renamedExport',
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
        description: 'Unused export: namedExport',
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
        description: 'Unused export: unusedZero',
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
        description: 'Unused export: unusedInMix',
        categories: ['Bug Risk'],
        location: { path: 'my-mix.ts', positions: { begin: { line: 1, column: 14 }, end: { line: 1, column: 14 } } },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: NamedExport',
        categories: ['Bug Risk'],
        location: { path: 'default.ts', positions: { begin: { line: 1, column: 14 }, end: { line: 1, column: 14 } } },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exports',
        description: 'Unused export: nsUnusedKey (MyNamespace)',
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
        description: 'Unused exported type: MyAnyType',
        categories: ['Bug Risk'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 28, column: 13 }, end: { line: 28, column: 13 } },
        },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exported types',
        description: 'Unused exported type: MyEnum',
        categories: ['Bug Risk'],
        location: { path: 'types.ts', positions: { begin: { line: 3, column: 13 }, end: { line: 3, column: 13 } } },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exported types',
        description: 'Unused exported type: MyType',
        categories: ['Bug Risk'],
        location: { path: 'types.ts', positions: { begin: { line: 8, column: 15 }, end: { line: 8, column: 15 } } },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Unused exported types',
        description: 'Unused exported type: MyNamespace (MyNamespace)',
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
        description: 'Duplicate export: exportedResult',
        categories: ['Duplication'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 26, column: 14 }, end: { line: 26, column: 14 } },
        },
        severity: 'major',
      },
      {
        type: 'issue',
        check_name: 'Duplicate exports',
        description: 'Duplicate export: default',
        categories: ['Duplication'],
        location: {
          path: 'my-module.ts',
          positions: { begin: { line: 30, column: 16 }, end: { line: 30, column: 16 } },
        },
        severity: 'major',
      },
    ],
  },
  {
    desc: 'files, unlisted & unresolved',
    cwd: 'fixtures/resolution/module-resolution-non-std',
    expected: [
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
        location: {
          path: 'src/index.ts',
          positions: { begin: { line: 10, column: 27 }, end: { line: 10, column: 27 } },
        },
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
    ],
  },
  {
    desc: 'enum members',
    cwd: 'fixtures/types/enum-members',
    expected: [
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
    ],
  },
  {
    desc: 'dependencies',
    cwd: 'fixtures/dependencies/basic',
    expected: [
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
    ],
  },
];

for (const { desc, cwd, expected } of cases) {
  test(`knip --reporter codeclimate (${desc})`, () => {
    const issues: Issue[] = JSON.parse(exec('knip --reporter codeclimate', { cwd: resolve(cwd) }).stdout);
    assert.deepEqual(issues.map(assertAndRemoveFingerprint).sort(orderByPos), expected.sort(orderByPos));
  });
}

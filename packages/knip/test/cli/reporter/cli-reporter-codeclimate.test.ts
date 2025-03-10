import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { resolve } from '../../../src/util/path.js';
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
      location: { path: 'my-module.ts', positions: { begin: { line: 23, column: 14 } } },
      severity: 'major',
      fingerprint: 'a692865478fa9a80269bc6f50131f440',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedFunction',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 24, column: 14 } } },
      severity: 'major',
      fingerprint: 'd6ea731db7a014e709a16b66d20e72cb',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'default',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 30, column: 8 } } },
      severity: 'major',
      fingerprint: '11e005cbcb18fcb3fae5ac241f5da2e6',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'renamedExport',
      categories: ['Bug Risk'],
      location: { path: 'named-exports.ts', positions: { begin: { line: 6, column: 30 } } },
      severity: 'major',
      fingerprint: 'abff03707fc1ceebfb71d845b316bee9',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'namedExport',
      categories: ['Bug Risk'],
      location: { path: 'named-exports.ts', positions: { begin: { line: 7, column: 15 } } },
      severity: 'major',
      fingerprint: 'a2548d2c445f76e38f55ee90392cee81',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedZero',
      categories: ['Bug Risk'],
      location: { path: 'dynamic-import.ts', positions: { begin: { line: 3, column: 14 } } },
      severity: 'major',
      fingerprint: 'c3d8f583d65359d4964b927781f57007',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'unusedInMix',
      categories: ['Bug Risk'],
      location: { path: 'my-mix.ts', positions: { begin: { line: 1, column: 14 } } },
      severity: 'major',
      fingerprint: 'fdd3be9d72cdd55b9665876fa3a143e9',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'NamedExport',
      categories: ['Bug Risk'],
      location: { path: 'default.ts', positions: { begin: { line: 1, column: 14 } } },
      severity: 'major',
      fingerprint: '2090022d9ccab3f3c476df5c57f2777c',
    },
    {
      type: 'issue',
      check_name: 'Unused exports',
      description: 'nsUnusedKey (MyNamespace)',
      categories: ['Bug Risk'],
      location: { path: 'my-namespace.ts', positions: { begin: { line: 3, column: 14 } } },
      severity: 'major',
      fingerprint: '231d97dfc8c9f9963e86f64521d8288c',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyAnyType',
      categories: ['Bug Risk'],
      location: { path: 'my-module.ts', positions: { begin: { line: 28, column: 13 } } },
      severity: 'major',
      fingerprint: '55523efc0469cbb3bf74c0b0518d0fd4',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyEnum',
      categories: ['Bug Risk'],
      location: { path: 'types.ts', positions: { begin: { line: 3, column: 13 } } },
      severity: 'major',
      fingerprint: '5a3687b379ef7ae0c7c51091244332a7',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyType',
      categories: ['Bug Risk'],
      location: { path: 'types.ts', positions: { begin: { line: 8, column: 14 } } },
      severity: 'major',
      fingerprint: '6de1187542653bff43089174077c28e8',
    },
    {
      type: 'issue',
      check_name: 'Unused exported types',
      description: 'MyNamespace (MyNamespace)',
      categories: ['Bug Risk'],
      location: { path: 'my-namespace.ts', positions: { begin: { line: 5, column: 18 } } },
      severity: 'major',
      fingerprint: 'e60cdcadefb9f088ccec0dbaf4138643',
    },
    {
      type: 'issue',
      check_name: 'Duplicate exports',
      description: 'exportedResult',
      categories: ['Duplication'],
      location: { path: 'my-module.ts', positions: { begin: { line: 26, column: 13 } } },
      severity: 'major',
      fingerprint: '092294dad3e67ff1e91a16e261ce1ada',
    },
    {
      type: 'issue',
      check_name: 'Duplicate exports',
      description: 'default',
      categories: ['Duplication'],
      location: { path: 'my-module.ts', positions: { begin: { line: 30, column: 15 } } },
      severity: 'major',
      fingerprint: 'd34a32bd4291a9638f6ee1bdfd77702f',
    },
  ];

  assert.equal(exec('knip --reporter codeclimate').stdout, `${JSON.stringify(json)}\n`);
});

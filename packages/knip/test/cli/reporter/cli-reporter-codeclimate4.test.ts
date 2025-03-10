import { test } from 'bun:test';
import assert from 'node:assert/strict';
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
      fingerprint: '4fc6300461b1aadeecb624d9314baa75',
    },
    {
      type: 'issue',
      check_name: 'Unused dependencies',
      description: 'fs-extra',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 10, column: 6 } } },
      severity: 'major',
      fingerprint: 'eabdb26f569d090d21b27541673fd724',
    },
    {
      type: 'issue',
      check_name: 'Unused devDependencies',
      description: 'mocha',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 23, column: 6 } } },
      severity: 'major',
      fingerprint: '2b41bc7a87140c799edc2db0eeb5bcf3',
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'jest',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: '12de7239cea598891f097ca87dd1b98b',
    },
    {
      type: 'issue',
      check_name: 'Unlisted binaries',
      description: 'start-server',
      categories: ['Bug Risk'],
      location: { path: 'package.json', positions: { begin: { line: 0, column: 0 } } },
      severity: 'major',
      fingerprint: '4ce470537162948a05d651a7cc80447e',
    },
  ];

  assert.equal(exec('knip --reporter codeclimate').stdout, `${JSON.stringify(json)}\n`);
});

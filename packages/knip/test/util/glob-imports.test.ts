import { test } from 'bun:test';
import assert from 'node:assert/strict';
import { regexToGlob } from '../../src/util/glob-imports.js';

const testCases: [string, string][] = [
  // Basic extension patterns
  ['.js$', '*.js'],
  ['^.js$', '*.js'],

  // Specific file patterns
  ['foo.test.jsx$', 'foo.test.jsx'],
  ['foo.(spec|test).ts$', 'foo.{spec,test}.ts'],

  // Grouped extensions with alternations
  ['.(js|ts|tsx)$', '*.{js,ts,tsx}'],
  ['somefile.config.(js|json)$', 'somefile.config.{js,json}'],

  // Prefix wildcards
  ['util-.*.js$', 'util-*.js'],

  // Character classes
  ['.[a-z]+rc$', '*rc'],
  ['^[ab].js$', '*.js'],
  ['^spec/[a-z]+.js$', 'spec/*.js'],

  // Universal wildcards
  ['.*', '**/*'],
  ['^.*$', '**/*'],

  // Directory patterns
  ['^pages/.*.vue$', 'pages/*.vue'],
  ['^components/.*/index.js$', 'components/*/index.js'],

  // ./ prefix patterns
  ['^./.*.html$', '**/*.html'],
  ['^./.*.config.(js|ts)$', '**/*.config.{js,ts}'],

  // Nested directory structures
  ['^src/.*/components/.*.tsx$', 'src/*/components/*.tsx'],
  ['^modules/[^/]+/index.js$', 'modules/*/index.js'],
];

test.each(testCases)('regexToGlob: /%s/ should be converted to %s', (regexSource, expectedGlob) => {
  const re = new RegExp(regexSource);
  const glob = regexToGlob(re);
  assert.equal(glob, expectedGlob, `Failed for ${regexSource} → ${glob}, expected ${expectedGlob}`);
});

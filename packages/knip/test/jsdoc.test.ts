import { test } from 'bun:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { main } from '../src/index.js';
import { resolve } from '../src/util/path.js';
import baseArguments from './helpers/baseArguments.js';
import baseCounters from './helpers/baseCounters.js';

const supportsJSDocImportTag = 'isJSDocImportTag' in ts;

test('Find imports from jsdoc @type tags', async () => {
  const cwd = resolve('fixtures/jsdoc');

  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['index.ts']['some-types']);
  assert(issues.unlisted['index.ts']['type-fest']);
  assert(issues.unlisted['index.ts']['more-types']);
  supportsJSDocImportTag && assert(issues.unlisted['index.ts']['some-module']);
  supportsJSDocImportTag && assert(issues.unlisted['index.ts']['some-other-module']);
  assert(issues.unlisted['index.ts']['@jest/types']);

  assert.deepEqual(counters, {
    ...baseCounters,
    unlisted: supportsJSDocImportTag ? 6 : 4,
    processed: 1,
    total: 1,
  });
});

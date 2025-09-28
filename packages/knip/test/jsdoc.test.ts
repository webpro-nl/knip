import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
import { main } from '../src/index.js';
import { createOptions } from '../src/util/create-options.js';
import baseCounters from './helpers/baseCounters.js';
import { resolve } from './helpers/resolve.js';

const cwd = resolve('fixtures/jsdoc');
const supportsJSDocImportTag = 'isJSDocImportTag' in ts;

test('Find imports from jsdoc @type tags', async () => {
  const options = await createOptions({ cwd });
  const { issues, counters } = await main(options);

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

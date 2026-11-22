import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSync } from 'oxc-parser';
import { buildJSDocTagLookup } from '../../src/typescript/visitors/jsdoc.ts';

const cases: [string, string, string[][]][] = [
  ['JSDoc tags', '/** @public */\nexport const value = 1;', [['@public']]],
  ['regular block tags', '/* @public */\nexport const value = 1;', [['@public']]],
  ['line tags', '// @public\nexport const value = 1;', [['@public']]],
  ['indented line tags', '\t // @lintignore\nexport const value = 1;', [['@lintignore']]],
  ['stacked line tags', '// @internal\n// @public\nexport const value = 1;', [['@internal', '@public']]],
  ['line tags after JSDoc', '/** @internal */\n// @public\nexport const value = 1;', [['@internal', '@public']]],
  ['line tags before JSDoc', '// @public\n/** Description */\nexport const value = 1;', [['@public']]],
  ['intervening line comment', '// @public\n// Explanation\nexport const value = 1;', [['@public']]],
  ['CRLF line comments', '// @public\r\n// Explanation\r\nexport const value = 1;', [['@public']]],
  ['CR line comments', '// @public\r// Explanation\rexport const value = 1;', [['@public']]],
  ['blank line', '// @public\n\nexport const value = 1;', [['@public']]],
  ['trailing line tags', 'export const first = 1; // @public\nexport const second = 2;', [[], []]],
  ['intervening code', '// @public\nconst local = 1;\nexport const value = local;', [[]]],
  ['next declaration', '// @public\nexport const first = 1;\nexport const second = 2;', [['@public'], []]],
  ['string contents', 'export const value = "// @public";', [[]]],
  ['untagged comment', '// Description\nexport const value = 1;', [[]]],
];

for (const [name, source, expected] of cases) {
  test(`Read comment tags: ${name}`, () => {
    const result = parseSync('module.ts', source);
    assert.deepEqual(result.errors, []);
    const getTags = buildJSDocTagLookup(result.comments, source);
    const actual = result.program.body
      .filter(node => node.type === 'ExportNamedDeclaration')
      .map(node => getTags(node.start));
    assert.deepEqual(
      actual,
      expected.map(tags => new Set(tags))
    );
  });
}

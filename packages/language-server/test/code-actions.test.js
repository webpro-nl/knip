import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createRemoveDependencyEdit, createRemoveExportEdit } from '../src/code-actions.js';

test('removes an export with the same edit as --fix', () => {
  const removeExport = (text, symbol, flags) => {
    const document = TextDocument.create('file:///project/fruits.ts', 'typescript', 1, text);
    const start = text.indexOf(symbol);
    const edit = createRemoveExportEdit(document, document.uri, { fixes: [[start, start + symbol.length, flags]] });
    return TextDocument.applyEdits(document, edit.changes[document.uri]);
  };
  assert.equal(removeExport('export { apple, pear };\n', 'apple', 3), 'export {  pear };\n');
  assert.equal(removeExport("export { apple } from './basket.ts';\n", 'apple', 3), ';\n\nexport {};\n');
  assert.equal(
    removeExport('enum Fruit {\n  Apple,\n  Pear,\n  Plum,\n}\n', 'Pear', 5),
    'enum Fruit {\n  Apple,\n  Plum,\n}\n'
  );
});

test('keeps the file a module when the quick fix removes its last export', () => {
  const text = 'export const FASTIFY_HELMET_CONFIG = {\n  xXssProtection: true,\n} as const;\n';
  const document = TextDocument.create('file:///project/fastify-helmet.config.ts', 'typescript', 1, text);
  const edit = createRemoveExportEdit(document, document.uri, { fixes: [[0, 7, 0]] });
  assert.equal(
    TextDocument.applyEdits(document, edit.changes[document.uri]),
    'const FASTIFY_HELMET_CONFIG = {\n  xXssProtection: true,\n} as const;\n\nexport {};\n'
  );
});

const uri = 'file:///project/package.json';

const manifest = (eol = '\n') =>
  [
    '{',
    '  "name": "project",',
    '  "dependencies": {',
    '    "react": "^19.0.0",',
    '    "lodash": "^4.17.21",',
    '    "chalk": "^5.0.0"',
    '  },',
    '  "devDependencies": {',
    '    "typescript": "^5.0.0"',
    '  }',
    '}',
    '',
  ].join(eol);

const issue = { type: 'dependencies', filePath: '/project/package.json', workspace: '.', symbol: '', fixes: [] };

const remove = (text, symbol) => {
  const document = TextDocument.create(uri, 'json', 1, text);
  const line = text.split(/\r?\n/).findIndex(l => l.includes(`"${symbol}"`)) + 1;
  const edit = createRemoveDependencyEdit(document, uri, { ...issue, symbol, line });
  return TextDocument.applyEdits(document, edit.changes[uri]);
};

for (const [label, eol] of [
  ['LF', '\n'],
  ['CRLF', '\r\n'],
]) {
  test(`removes first dependency (${label})`, () => {
    const result = remove(manifest(eol), 'react');
    assert.deepEqual(JSON.parse(result).dependencies, { lodash: '^4.17.21', chalk: '^5.0.0' });
  });

  test(`removes middle dependency (${label})`, () => {
    const result = remove(manifest(eol), 'lodash');
    assert.deepEqual(JSON.parse(result).dependencies, { react: '^19.0.0', chalk: '^5.0.0' });
  });

  test(`removes last dependency (${label})`, () => {
    const result = remove(manifest(eol), 'chalk');
    assert.deepEqual(JSON.parse(result).dependencies, { react: '^19.0.0', lodash: '^4.17.21' });
    assert.ok(result.includes(`"lodash": "^4.17.21"${eol}  }`));
  });

  test(`removes sole dependency (${label})`, () => {
    const result = remove(manifest(eol), 'typescript');
    assert.deepEqual(JSON.parse(result).devDependencies, {});
  });
}

test('removes dependency with escaped quotes in its value', () => {
  const text = '{\n  "dependencies": {\n    "lodash": "file:./vendor/pkg-\\"quoted\\""\n  }\n}\n';
  assert.deepEqual(JSON.parse(remove(text, 'lodash')).dependencies, {});
});

for (const [label, text] of [
  ['inline section', '{\n  "dependencies": { "lodash": "*", "chalk": "*" }\n}\n'],
  ['single-line manifest', '{"dependencies":{"lodash":"*"}}\n'],
  ['two dependencies on a line', '{\n  "dependencies": {\n    "lodash": "*", "chalk": "*"\n  }\n}\n'],
  ['closing brace on the line', '{\n  "dependencies": {\n    "lodash": "*" }\n}\n'],
]) {
  test(`skips dependency not on its own line (${label})`, () => {
    const document = TextDocument.create(uri, 'json', 1, text);
    const line = text.split('\n').findIndex(l => l.includes('"lodash"')) + 1;
    assert.equal(createRemoveDependencyEdit(document, uri, { ...issue, symbol: 'lodash', line }), null);
  });
}

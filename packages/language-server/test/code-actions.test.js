import assert from 'node:assert/strict';
import test from 'node:test';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createRemoveDependencyEdit } from '../src/code-actions.js';

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

const remove = (text, symbol) => {
  const document = TextDocument.create(uri, 'json', 1, text);
  const line = text.split(/\r?\n/).findIndex(l => l.includes(`"${symbol}"`)) + 1;
  const edit = createRemoveDependencyEdit(document, uri, { type: 'dependencies', symbol, line });
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

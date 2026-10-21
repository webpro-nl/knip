import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeGetImportsAndExports } from '../../src/native-analyzer.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import type { FileNode } from '../../src/types/module-graph.ts';
import { _getImportsAndExports } from '../reference/typescript/get-imports-and-exports.ts';
import { buildVisitor } from '../reference/typescript/visitors/walk.ts';

const options: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: true,
  isFixTypes: true,
  isReportExports: true,
  tags: [[], []],
};
const resolver = () => ({
  resolvedFileName: '/workspace/node_modules/dependency/index.js',
  isExternalLibraryImport: true,
});

function analyze(source: string, filePath = '/workspace/module.ts') {
  const context = {
    filePath: '',
    sourceText: '',
    addScript() {},
    addImport() {},
    markImportExpressionHandled() {},
    addImportGlob() {},
    markExportRegistered() {},
  };
  return {
    expected: _getImportsAndExports(
      filePath,
      source,
      resolver,
      options,
      false,
      false,
      buildVisitor([], false),
      context
    ),
    actual: nativeGetImportsAndExports(filePath, source, resolver, options, false, false, []),
  };
}

function tagReferences(file: FileNode) {
  const entries: Array<[string, Set<string> | undefined]> = [];
  for (const [name, item] of file.exports) {
    entries.push([`export:${name}`, item.jsDocTags]);
    for (const member of item.members) entries.push([`member:${name}.${member.identifier}`, member.jsDocTags]);
  }
  const categories: Array<'external' | 'imports' | 'unresolved'> = ['external', 'imports', 'unresolved'];
  for (const category of categories) {
    for (const item of file.imports[category]) entries.push([`${category}:${item.identifier}`, item.jsDocTags]);
  }
  return entries;
}

function tagGraph(files: FileNode[]) {
  const ids = new Map<Set<string>, number>();
  const records = [];
  for (const file of files) {
    const entries = [];
    for (const [name, tags] of tagReferences(file)) {
      if (tags === undefined) {
        entries.push({ name, tags });
        continue;
      }
      let id = ids.get(tags);
      if (id === undefined) {
        id = ids.size;
        ids.set(tags, id);
      }
      entries.push({ name, tags: [...tags], id });
    }
    records.push(entries);
  }
  return records;
}

function compare(source: string, filePath?: string) {
  const { actual, expected } = analyze(source, filePath);
  assert.deepEqual(tagGraph([actual]), tagGraph([expected]), source);
  return actual;
}

test('JSDoc merges propagate through a declaration comment group', () => {
  const file = compare('/** @alpha */ export var a=1,b=2; /** @beta @alpha */ export var a=3;');
  const a = file.exports.get('a')!;
  const b = file.exports.get('b')!;
  assert.deepEqual([...b.jsDocTags], ['@alpha', '@beta']);
  assert.strictEqual(a.jsDocTags, b.jsDocTags);
  compare('/** @alpha */ export var a=1,a=2,b=3; /** @beta */ export var a=4;');
});

test('JSDoc re-export merges preserve sharing and absent import tags', () => {
  const file = compare(`/** @alpha */ export { a, b } from 'dependency';
    /** @beta */ export { a } from 'dependency';`);
  const imports = [...file.imports.external];
  assert.strictEqual(file.exports.get('a')!.jsDocTags, file.exports.get('b')!.jsDocTags);
  assert.deepEqual([...file.exports.get('b')!.jsDocTags], ['@alpha', '@beta']);
  for (const item of imports) assert.strictEqual(item.jsDocTags, undefined);
});

test('JSDoc namespace member merges retain comment group sharing', () => {
  const file = compare(`export namespace N {
    /** @alpha */ export var a=1,b=2;
    /** @beta */ export var a=3;
    export namespace Nested {
      /** @one */ export var c=1,d=2;
      /** @two */ export var c=3;
    }
  }`);
  const [a, b, c, d] = file.exports.get('N')!.members;
  assert.strictEqual(a.jsDocTags, b.jsDocTags);
  assert.strictEqual(c.jsDocTags, d.jsDocTags);
  assert.deepEqual([...b.jsDocTags], ['@alpha', '@beta']);
  assert.deepEqual([...d.jsDocTags], ['@one', '@two']);
});

test('JSDoc merges copy empty tags without adopting the incoming group', () => {
  const source = `export var a=1,b=2;
    /** @beta */ export var a=3,c=4;
    /** @gamma */ export var a=5;`;
  const file = compare(source);
  assert.deepEqual([...file.exports.get('a')!.jsDocTags], ['@beta', '@gamma']);
  assert.deepEqual([...file.exports.get('b')!.jsDocTags], []);
  assert.deepEqual([...file.exports.get('c')!.jsDocTags], ['@beta']);
  assert.notStrictEqual(file.exports.get('a')!.jsDocTags, file.exports.get('c')!.jsDocTags);
  compare(`export namespace N { ${source} }`);
  compare(`export { a, b } from 'dependency';
    /** @beta */ export { a, c } from 'dependency';
    /** @gamma */ export { a } from 'dependency';`);
});

test('Equal JSDoc comment groups stay distinct and inline re-export tags create fresh unions', () => {
  compare(`/** @alpha */ import { a, b } from 'dependency';
    /** @alpha */ import { c, d } from 'dependency';
    /** @alpha */ export var first=1,second=2;
    /** @alpha */ export var third=3,fourth=4;`);
  const file = compare(`/** @alpha */ export { /** @alpha */ a, b, /** @beta */ c } from 'dependency';
    /** @gamma */ export { a } from 'dependency';`);
  assert.notStrictEqual(file.exports.get('a')!.jsDocTags, file.exports.get('b')!.jsDocTags);
  assert.deepEqual([...file.exports.get('b')!.jsDocTags], ['@alpha']);
  assert.deepEqual([...file.exports.get('c')!.jsDocTags], ['@alpha', '@beta']);
  compare(`const a=1,b=2; /** @alpha */ export { /** @beta */ a, b };`);
});

test('JSDoc import and member records preserve empty, absent, and shared tags', () => {
  compare(`/** @alpha */ import Default, { a, b } from 'dependency';
    /** @beta */ const { c, d } = require('dependency');
    /** @gamma */ const ns = require('dependency');
    import { emptyA, emptyB } from 'dependency';
    require('dependency');
    import('dependency');
    export enum E { First, /** @member */ Second, Third }
    export var plain=1;`);
  compare('exports.a=1; exports.b=2; module.exports={a,b};', '/workspace/module.cjs');
  compare(`/** @alpha */ export { readFile, writeFile } from 'node:fs';
    /** @beta */ export { readFile } from 'node:fs';`);
});

test('Empty JSDoc tags preserve sharing within each file and isolate file analyses', () => {
  const first = analyze(
    `export var plain=1; import { a, b } from 'dependency';
    /** @alpha */ export var tagged=2;`,
    '/workspace/first.ts'
  );
  const second = analyze(
    `export namespace N { export var member=1; }
    /** @alpha */ export var tagged=2;`,
    '/workspace/second.ts'
  );
  const third = analyze(
    `export var plain=1; /** @beta */ export var plain=2;
    export var empty=3;`,
    '/workspace/third.ts'
  );
  for (const { actual, expected } of [first, second, third]) {
    assert.deepEqual(tagGraph([actual]), tagGraph([expected]));
  }
  assert.notStrictEqual(first.actual.exports.get('plain')!.jsDocTags, second.actual.exports.get('N')!.jsDocTags);
  assert.notStrictEqual(first.actual.exports.get('plain')!.jsDocTags, third.actual.exports.get('empty')!.jsDocTags);
  assert.notStrictEqual(first.actual.exports.get('tagged')!.jsDocTags, second.actual.exports.get('tagged')!.jsDocTags);
  first.actual.exports.get('plain')!.jsDocTags.add('@deprecated');
  assert.deepEqual([...second.actual.exports.get('N')!.jsDocTags], []);
  assert.deepEqual([...third.actual.exports.get('empty')!.jsDocTags], []);
  assert.deepEqual([...analyze('export const fresh = 1;').actual.exports.get('fresh')!.jsDocTags], []);
});

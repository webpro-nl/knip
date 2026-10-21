import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { globSync } from 'tinyglobby';
import { native, rawComments, wasiParser } from '../../src/native.ts';
import { _parseFile } from '../../src/typescript/ast-nodes.ts';
import { extractSpecifiers } from '../reference/typescript/follow-imports.ts';
import { resolve } from '../../src/util/path.ts';

test('Native specifier extraction matches the reference across the fixture corpus', () => {
  const files = globSync('fixtures/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}', { ignore: ['**/tmp/**'] });
  assert.ok(files.length > 1000);
  for (const file of files) {
    const filePath = resolve(file);
    const sourceText = readFileSync(filePath, 'utf8');
    const parsed = _parseFile(filePath, sourceText);
    assert.equal(native.isAmbientDeclarationFile(filePath, sourceText), parsed.module.staticExports.length === 0, file);
    assert.deepEqual(
      native.extractSpecifiers(filePath, sourceText),
      extractSpecifiers(parsed, sourceText, filePath),
      file
    );
  }
});

test('Native specifier extraction preserves ordering, duplicates and syntax edge cases', () => {
  const sources = [
    'import "side-effect"; import { x } from "named"; export { x }; export * from "star"; export { a, b } from "pair";',
    'import { name } from "early"; export const local = 1; export { name as later };',
    'require("one"); require.resolve(`two`); require["resolve"]("ignored"); import third = require("three");',
    'import("raw\\u0061"); import(`template`); import(variable); import("a" + "b"); import(`prefix${name}`);',
    '/** import("type") import(\'second\') */ // import("line")\nconst emoji = "🍎"; import("unicode");',
    'import "before"; const broken = ; require("after");',
    'return require("top-level");',
    'declare module "ambient" { export { value } from "inner"; import type { Type } from "types"; }',
    'const source = (require)("paren"); require.resolve?.("optional"); require?.("optional-direct");',
    '/** import(\uFEFF"bom") import(\u0085"nel") */',
    'require("\\uD800"); require("\\uDC00"); require(`\\uDFFF`);',
  ];
  for (const filePath of [
    '/project/source.ts',
    '/project/source.js',
    '/project/source.vue',
    '/project/node_modules/pkg/index.ts',
    '/project/node_modules-backup/index.ts',
  ]) {
    for (const sourceText of sources) {
      const parsed = _parseFile(filePath, sourceText);
      assert.deepEqual(
        native.extractSpecifiers(filePath, sourceText),
        extractSpecifiers(parsed, sourceText, filePath),
        `${filePath}: ${sourceText}`
      );
    }
  }
});

test('Native specifier extraction matches private require.resolve names', () => {
  const cases: [string, string[]][] = [
    ['class Loader { #resolve; run(require) { require.#resolve("./dep"); } }', ['./dep']],
    ['class Loader { #resolve; run(require) { require.#resolve?.("./optional"); } }', ['./optional']],
    [
      'class Loader { #r\\u0065solve; run(r\\u0065quire) { r\\u0065quire.#r\\u0065solve("./escaped"); } }',
      ['./escaped'],
    ],
    [
      'class Loader { #resolve; #other; run(require, loader) { loader.#resolve("./ignored"); require.#other("./ignored"); require["resolve"]("./ignored"); require.resolve("./public"); require.#resolve("./private"); } }',
      ['./public', './private'],
    ],
  ];
  for (const filePath of ['/project/source.ts', '/project/source.js', '/project/node_modules/pkg/index.ts']) {
    for (const [sourceText, expected] of cases) {
      const reference = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
      assert.deepEqual(reference, filePath.includes('node_modules') ? [] : expected);
      assert.deepEqual(native.extractSpecifiers(filePath, sourceText), reference, sourceText);
    }
  }
});

test('Native specifier extraction preserves original UTF-16 slices and parser replacement semantics', () => {
  const values = [
    String.fromCharCode(0xd800),
    String.fromCharCode(0xdc00),
    String.fromCharCode(0xd800, 0xd800, 0xdc00, 0xdc00),
    'é🍎�',
    '\\uD800',
  ];
  for (const filePath of ['/project/source.ts', '/project/source.js', '/project/node_modules/pkg/index.ts']) {
    for (const value of values) {
      const sourceText = `const prefix = "é🍎${value}"; import("${value}"); import(\`./${value}\`); import(variable); import("${value}$ignored"); import("${value}+ignored"); import("");`;
      const reference = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
      if (!wasiParser) assert.deepEqual(reference, [value, './' + value, 'variable']);
      assert.deepEqual(native.extractSpecifiers(filePath, sourceText), reference, sourceText);
    }
  }
  const filePath = '/project/source.ts';
  const surrogate = String.fromCharCode(0xd800);
  const cases: [string, string[]][] = [
    [
      'import "./' + surrogate + '"; export * from "./' + surrogate + '"; require("./' + surrogate + '");',
      ['./�', './�', './�'],
    ],
    ['const ' + surrogate + ' = 1; import("./dep");', []],
    ['const \\uD800 = 1; import("./dep");', ['./dep']],
    ['const 𐐀 = "🍎"; import("./' + surrogate + '");', ['./' + surrogate]],
    ['const \\u{10400} = "🍎"; import("./' + surrogate + '");', ['./' + surrogate]],
  ];
  for (const [sourceText, expected] of cases) {
    const reference = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
    if (!wasiParser) assert.deepEqual(reference, expected, sourceText);
    assert.deepEqual(native.extractSpecifiers(filePath, sourceText), reference, sourceText);
  }
});

test('Native specifier extraction matches the host raw-transfer mode for comment UTF-16 slices', () => {
  for (const value of [String.fromCharCode(0xd800), String.fromCharCode(0xdc00), 'é🍎�']) {
    const sourceText = `const prefix = "é🍎${value}"; /** 🍎 import("./${value}") import("./second${value}") */ import("./${value}"); // import("./ignored")`;
    for (const filePath of ['/project/source.ts', '/project/source.js', '/project/node_modules/pkg/index.ts']) {
      const reference = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
      const commentValue = rawComments ? value : value.toWellFormed();
      if (!wasiParser) assert.deepEqual(reference, ['./' + value, './' + commentValue, './second' + commentValue]);
      assert.deepEqual(native.extractSpecifiers(filePath, sourceText), reference, sourceText);
    }
  }
});

test('Native specifier extraction preserves baseline decorator traversal omissions', () => {
  const cases: [string, string[], string[]][] = [
    ['class C { constructor(@require("./dec") x) {} }', ['./dec'], []],
    [
      '@require("./class") class C { @require("./method") m(@require("./param") x = require("./default")) { require("./body"); } }',
      ['./class', './method', './param', './default', './body'],
      ['./class', './method', './default', './body'],
    ],
    ['class C { constructor(@require("./param") ...args) { require("./body"); } }', ['./param', './body'], ['./body']],
    [
      'class C { constructor(@require("./param") {x = require("./destructure")} = require("./default")) { require("./body"); } }',
      ['./param', './destructure', './default', './body'],
      ['./destructure', './default', './body'],
    ],
    ['abstract class C { @require("./dec") abstract m(): void; }', [], []],
    [
      'abstract class C { @require("./ignored") abstract [require("./key")](@require("./param") x = require("./default")): void; }',
      ['./key', './param', './default'],
      [],
    ],
    ['abstract class C { @require("./property") abstract field: string; }', ['./property'], []],
    ['abstract class C { @import("./dynamic") abstract m(): void; }', ['./dynamic'], []],
    ['class C { constructor(@import("./dynamic") x) {} }', ['./dynamic'], ['./dynamic']],
  ];
  for (const filePath of ['/project/source.ts', '/project/source.js', '/project/source.vue']) {
    for (const [sourceText, typescript, javascript] of cases) {
      const reference = extractSpecifiers(_parseFile(filePath, sourceText), sourceText, filePath);
      assert.deepEqual(reference, filePath.endsWith('.js') ? javascript : typescript, sourceText);
      assert.deepEqual(native.extractSpecifiers(filePath, sourceText), reference, filePath + ': ' + sourceText);
    }
  }
});

test('Native source conversion preserves module recovery, ambient detection and original dynamic slices', () => {
  const high = String.fromCharCode(0xd800);
  const low = String.fromCharCode(0xdfff);
  const cases: [string, string[], string[]][] = [
    ['import("' + high + '")', [high], []],
    ['import("' + high + 'X")', [high + 'X'], [high + 'X']],
    ['require("' + high + 'X")', ['�X'], [String.fromCodePoint(0x10058)]],
    ['import "' + low + 'X";', ['�X'], [String.fromCodePoint(0x10fc58)]],
    ['import "' + high + high + '";', ['��'], [String.fromCodePoint(0x10000)]],
    [
      'import "before"; export * from "before-export"; import("' + high + '"); import "after";',
      ['before', 'after', 'before-export', high],
      ['before', 'before-export'],
    ],
    [
      'import("before"); require("before-require"); import("' + high + '");',
      ['before', high, 'before-require'],
      ['before'],
    ],
    ['import "before"; /* ' + high + '*/ import "after";', ['before', 'after'], ['before']],
    ['const ' + high + 'X = 1; import("after"); export const value = 1;', [], ['after']],
    ['import("\\uD800"); require("\\uD800"); export const value = 1;', ['\\uD800', high], ['\\uD800', high]],
    ['import("🍎"); require("�");', ['🍎', '�'], ['🍎', '�']],
  ];
  for (const [sourceText, nativeExpected, wasiExpected] of cases) {
    const filePath = '/project/module.ts';
    const parsed = _parseFile(filePath, sourceText);
    const expected = extractSpecifiers(parsed, sourceText, filePath);
    assert.deepEqual(expected, wasiParser ? wasiExpected : nativeExpected, sourceText);
    assert.deepEqual(native.extractSpecifiers(filePath, sourceText), expected, sourceText);
    assert.equal(
      native.isAmbientDeclarationFile(filePath, sourceText),
      parsed.module.staticExports.length === 0,
      sourceText
    );
  }
});

test('Native parser normalizes original filename extensions before host conversion', () => {
  const high = String.fromCharCode(0xd800);
  for (const filePath of [
    '/project/' + high + '.ts',
    '/project/' + high + '.tsx',
    '/project/' + high + '.js',
    '/project/' + high + '.vue',
    '/project/' + high + 'X.tsx',
    '/project/' + high + 'node_modules/pkg.js',
    '/project/.js',
    '/project/module.unknown',
  ]) {
    for (const sourceText of [
      'const value: number = 1; export { value }; require("./dep");',
      'export const element = <div/>; require("./dep");',
      'require("./dep"); export const value = 1;',
    ]) {
      const parsed = _parseFile(filePath, sourceText);
      assert.deepEqual(
        native.extractSpecifiers(filePath, sourceText),
        extractSpecifiers(parsed, sourceText, filePath),
        filePath + ': ' + sourceText
      );
      assert.equal(
        native.isAmbientDeclarationFile(filePath, sourceText),
        parsed.module.staticExports.length === 0,
        filePath + ': ' + sourceText
      );
    }
  }
});

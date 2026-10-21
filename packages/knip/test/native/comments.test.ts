import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { globSync } from 'tinyglobby';
import { rawComments, wasiParser } from '../../src/native.ts';
import { _parseFile } from '../../src/typescript/ast-nodes.ts';
import { buildLineStarts, getLineAndCol } from '../reference/typescript/ast-nodes.ts';
import { extractImportsFromComments } from '../reference/typescript/comments.ts';
import { buildJSDocTagLookup } from '../reference/typescript/visitors/jsdoc.ts';
import { resolve } from '../../src/util/path.ts';

interface ImportRequest {
  specifier: string;
  identifier?: string;
  alias?: string;
  namespace?: string;
  pos: number;
  modifiers: number;
  specifierPos?: number;
  jsDocTags?: string[];
}

interface NativeComments {
  analyzeComments: (
    filePath: string,
    sourceText: string,
    nodeStarts: number[],
    rawComments?: boolean,
    wasiParser?: boolean
  ) => { imports: ImportRequest[]; tags: string[][] };
  analyzePositions: (
    sourceText: string,
    byteOffsets: number[]
  ) => { lineStarts: number[]; positions: { pos: number; line: number; col: number }[] };
}

const require = createRequire(import.meta.url);
const native: NativeComments = require('knip/native');

const normalize = (request: ImportRequest): ImportRequest => ({
  specifier: request.specifier,
  identifier: request.identifier ?? undefined,
  alias: request.alias ?? undefined,
  namespace: request.namespace ?? undefined,
  pos: request.pos,
  modifiers: request.modifiers,
  specifierPos: request.specifierPos ?? undefined,
  jsDocTags: request.jsDocTags ?? undefined,
});

const compareComments = (filePath: string, sourceText: string) => {
  const parsed = _parseFile(filePath, sourceText);
  const expected: ImportRequest[] = [];
  extractImportsFromComments(
    parsed.comments,
    parsed.program.body[0]?.start ?? Number.POSITIVE_INFINITY,
    (specifier, identifier, alias, namespace, pos, modifiers) => {
      expected.push(normalize({ specifier, identifier, alias, namespace, pos, modifiers }));
    }
  );
  const starts = new Set([0, sourceText.length]);
  for (const node of parsed.program.body) starts.add(node.start);
  for (const comment of parsed.comments) {
    starts.add(comment.start);
    starts.add(comment.end);
    let end = comment.end;
    while (end < sourceText.length && /[ \t\r\n]/.test(sourceText[end])) end++;
    starts.add(end);
    if (end > 0) starts.add(end - 1);
    if (end < sourceText.length) starts.add(end + 1);
  }
  const getTags = buildJSDocTagLookup(parsed.comments, sourceText);
  const expectedTags: string[][] = [];
  for (const start of starts) expectedTags.push([...getTags(start)]);
  const actual = native.analyzeComments(filePath, sourceText, [...starts], rawComments, wasiParser);
  const actualImports: ImportRequest[] = [];
  for (const request of actual.imports) actualImports.push(normalize(request));
  assert.deepEqual(actualImports, expected, `${filePath}: imports`);
  assert.deepEqual(actual.tags, expectedTags, `${filePath}: ordered tags`);
};

test('Native comments and ordered tags match the reference across the fixture corpus', () => {
  const files = globSync('fixtures/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}', { ignore: ['**/tmp/**'] });
  assert.ok(files.length > 1000);
  for (const file of files) compareComments(resolve(file), readFileSync(file, 'utf8'));
});

test('Native comments preserve regex behavior, import ordering and malformed snippet records', () => {
  const sources = [
    '',
    '/** @type {import("types").Value} */',
    '/** @type {{ nested: import("types").Value }} */',
    '/** @type {string} import("outside") @example {import("example")} */',
    '/** @typeé {import("types").Météo} @type_ {import("ignored")} */',
    '/** import("prose") @example {import("example")} */',
    '/** @type {import("mismatch\').Value} */',
    '/** @type {import("empty-member"). import("numeric").123 import("dollar").$Value} */',
    '/** @type {import("escaped\\u0061").Value} */',
    '/** @import Default, { Named, Original as Alias, "quoted-name" as Quoted } from "types" */',
    '/** @import { default as Default, Value as Value } from "types" */',
    '/** @import {} from "types" */',
    '/** @import "types" */',
    '/** @import * as Namespace from "types" */',
    '/** @import { Value } from "types"; bad { */',
    '/** @import {} from ""; import { Other } from "other" */',
    '/** @import { Value } from "first"; import { Other } from "other" */',
    '/** @import { Value } from "types" with { type: "json" } */',
    '/** Mention @import { Missing } from "prose" */',
    '/** @imported { Missing } from "prose" */',
    '/** @import\f{ Missing } from "prose" */',
    '/**\r\n * @import\r\n * * as Namespace\r\n * from "types"\r\n * @param {import("param").Value} value\r\n */',
    '/**\n * @import Default, {\n * Named, Original as Alias\n * } from "types"\n * @type {import("nested").Value}\n * @jsxImportSource preact\n * @jest-environment jsdom\n */',
    '/* 🍎 */\r\n/** @type {import("types").Value} */\r\nexport {};',
    '/** 🍎 @type {import("types").Value} @jest-environment jsdom */',
    '// @jsxImportSource preact @jsxImportSource ignored\nexport {};',
    '// @vitest-environment node @jest-environment node\nexport {};',
    '// @vitest-environment ./local @jest-environment /absolute\nexport {};',
    '// @vitest-environment edge-runtime @jest-environment jsdom\nexport {};',
    '// @jest-environment @scope/environment @vitest-environment happy-dom\nexport {};',
    '// @vitest-environment before\n"use strict";\n// @jest-environment after',
    'export {};\n/** @jest-environment after @jsxImportSource preact */',
    '#!/usr/bin/env node\n// @jest-environment jsdom\n',
    '/// <reference types="types" />\n/// <reference path="./local.d.ts" />',
    '/// <reference types = "types" preserve="true" /> <reference types="ignored" />',
    '// prefix <reference path="./local.d.ts" /> suffix',
    '/// <reference types=\'ignored\' />\n/* <reference types="ignored-block" /> */',
    '/// <reference types="ignored" attribute="/" />',
    '/// <reference types="types" /> @jest-environment jsdom @jsxImportSource preact',
    '/** @import { "\\uD800" as Value } from "types" */',
    '/** @import { Value } from "\\uDFFF" */',
    '/** @import { "\\ufffdD800" as Value } from "\\ufffdDFFF" */',
    '/** @type {import("\\uD800").Value} */',
    'const broken = ;\n// @jest-environment jsdom\n/** @type {import("types").Value} */',
    '<!-- @jest-environment jsdom\n// @public\nconst value = 1;',
    '--> @jest-environment jsdom\nconst value = 1;',
  ];
  for (const extension of ['js', 'ts', 'd.ts', 'd.mts', 'd.cts', 'tsx', 'vue']) {
    for (const [index, source] of sources.entries()) compareComments(`/project/case-${index}.${extension}`, source);
  }
});

test('Native comments use JavaScript whitespace and ASCII word boundaries', () => {
  const whitespace = [
    '\t',
    '\n',
    '\v',
    '\f',
    '\r',
    ' ',
    '\u00a0',
    '\u1680',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200a',
    '\u2028',
    '\u2029',
    '\u202f',
    '\u205f',
    '\u3000',
    '\ufeff',
    '\u0085',
    '\u180e',
    '\u200b',
    '🍎',
  ];
  for (const space of whitespace) {
    const source = `/** @type {import(${space}"types"${space}).Value} @jsxImportSource${space}preact @jest-environment${space}jsdom */\n/// <reference${space}types${space}=${space}"types" />`;
    compareComments(`/project/whitespace-${space.codePointAt(0)}.ts`, source);
  }
  for (const tag of [
    'type',
    'typedef',
    'callback',
    'param',
    'arg',
    'argument',
    'property',
    'prop',
    'return',
    'returns',
    'yield',
    'yields',
    'throw',
    'throws',
    'exception',
    'this',
    'extends',
    'augments',
    'implements',
    'enum',
    'template',
    'satisfies',
    'const',
    'constant',
    'member',
    'var',
    'namespace',
    'module',
    'example',
    'Type',
    'typeX',
    'type_',
    'type1',
    'typeé',
  ]) {
    compareComments(`/project/tag-${tag}.ts`, `/** @${tag} {import("types").Value} */`);
  }
});

test('Native comments preserve raw UTF-16 captures and lossy synthetic import parsing', () => {
  for (const value of [
    String.fromCharCode(0xd800),
    String.fromCharCode(0xdc00),
    String.fromCharCode(0xd800, 0xd800, 0xdc00, 0xdc00),
    'é🍎�',
    '\\uD800',
    '\0Sd800',
    '\0N',
  ]) {
    const sources = [
      '/** 🍎 @type {import("./' + value + '").Value} */',
      '// @jsxImportSource ' + value,
      '/// <reference types="' + value + '" />',
      '/// <reference path="./' + value + '.d.ts" />',
      '/** @import { Value } from "./' + value + '" */',
      '/** @import { "' + value + '" as Value } from "./types" */',
      '/** @type {import("./' + value + '").Value}\n * @import { Value } from "./' + value + '" */',
    ];
    for (const extension of ['js', 'ts', 'vue']) {
      for (const source of sources) {
        compareComments('/project/unicode.' + extension, '/* é🍎' + value + ' */\n' + source + '\nexport {};');
      }
    }
  }
});

test('Native ordered tags preserve exact declaration reach and comment grouping', () => {
  const sources = [
    '/** @first @shared */\n// @second @shared\n// explanation\nexport const value = 1;',
    '// @public\r// Explanation\rexport declare const value: string;',
    '// @public\r\n// Explanation\r\nexport declare const value: string;',
    '// @public\n\nexport const first = 1;\nexport const second = 2;',
    'export const first = 1; // @trailing\nexport const second = 2;',
    'export const first = 1; /* @block */\nexport const second = 2;',
    '// @public\nconst local = 1;\nexport const value = local;',
    '// @public\n/** no tags */\nexport const value = 1;',
    '/** @A @a @_ @123 @dash-name @é @🍎 @@next @same @same */\nexport const value = 1;',
    '/** @public */\u00a0export const value = 1;',
    '/** @public */\ufeffexport const value = 1;',
    '// @public\u2028export const value = 1;',
    '\u00a0// @public\nexport const value = 1;',
    '/* @before */ // @inline\nexport const value = 1;',
    '// @outer\nexport declare namespace Values {\n/** @inner */\nexport const value: string;\n}',
    'declare module "types" {\n// @public\nexport interface Value {}\n}',
    '/** 🍎 @public */\nexport enum Values {\n// @member\nFirst,\n/** @other */ Second\n}',
    '/** @trailing */',
    '// @trailing\n',
  ];
  for (const [index, source] of sources.entries()) compareComments(`/project/tags-${index}.d.ts`, source);
});

test('Native positions match UTF16 offsets and LF-only line and column lookup', () => {
  const sources = ['', 'a\n', '\r\n\r', 'é中🍎\r\n𐐀z\r\u2028x\u2029\n', '\ufeffexport const 🍎 = "é";\n'];
  for (const source of sources) {
    const byteOffsets = [0];
    const utf16Offsets = [0];
    let byteOffset = 0;
    let utf16Offset = 0;
    for (const char of source) {
      byteOffset += Buffer.byteLength(char);
      utf16Offset += char.length;
      byteOffsets.push(byteOffset);
      utf16Offsets.push(utf16Offset);
    }
    const lineStarts = buildLineStarts(source);
    const expectedPositions = [];
    for (const pos of utf16Offsets) expectedPositions.push({ pos, ...getLineAndCol(lineStarts, pos) });
    assert.deepEqual(native.analyzePositions(source, byteOffsets), { lineStarts, positions: expectedPositions });
  }
});

test('Native comment diagnostics preserve source conversion and original tag boundaries', () => {
  const high = String.fromCharCode(0xd800);
  for (const sourceText of [
    'const marker = 1; ' + high + '\n// @public\nexport const value=1;',
    '// @jsxImportSource ' + high,
    '// @jsxImportSource ' + high + '\nimport "after";',
    '/** @type {import("' + high + 'X").Value} */',
    '/** @import {Value} from "' + high + 'X" */',
    '/// <reference types="' + high + 'X" />',
    '/* @public ' + high + '*/ export const value=1;',
  ])
    compareComments('/project/module.ts', sourceText);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeGetImportsAndExports, nativeGetImportsAndExportsWithResolver } from '../../src/native-analyzer.ts';
import { NativeModuleResolver } from '../../src/native-module-resolver.ts';
import { rawComments, wasiParser } from '../../src/native.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import type { ResolveModule } from '../../src/typescript/ast-nodes.ts';
import { _getImportsAndExports } from '../reference/typescript/get-imports-and-exports.ts';
import { createCustomModuleResolver } from '../reference/typescript/resolve-module-names.ts';
import { buildVisitor } from '../reference/typescript/visitors/walk.ts';
import { resolverPlan } from './resolver-plan.ts';

const options: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: true,
  isFixTypes: true,
  isReportExports: true,
  tags: [[], []],
};

const reference = (filePath: string, sourceText: string, resolver: ResolveModule) =>
  _getImportsAndExports(filePath, sourceText, resolver, options, false, false, buildVisitor([], false), {
    filePath: '',
    sourceText: '',
    addScript() {},
    addImport() {},
    markImportExpressionHandled() {},
    addImportGlob() {},
    markExportRegistered() {},
  });

const sources: string[] = [];
for (const value of [
  String.fromCharCode(0xd800),
  String.fromCharCode(0xdc00),
  String.fromCharCode(0xd800, 0xd800, 0xdc00, 0xdc00),
  'é🍎�',
  '\\uD800',
  '\0Sd800',
  '\0N',
]) {
  sources.push(
    '/** @type {import("' + value + '").Value} */',
    '// @jsxImportSource ' + value,
    '/// <reference types="' + value + '" />',
    '/// <reference path="./' + value + '.d.ts" />',
    '/** @import { Value } from "' + value + '" */',
    '/** 🍎' +
      value +
      ' @type {import("./' +
      value +
      '").Value}\n * @import { Value } from "./' +
      value +
      '" */\nexport {};'
  );
}

test('Native analyzer preserves raw comment specifiers in callbacks and complete records', () => {
  for (const sourceText of sources) {
    const filePath = '/workspace/comment.ts';
    const expectedCalls: string[] = [];
    const actualCalls: string[] = [];
    const expected = reference(filePath, sourceText, specifier => {
      expectedCalls.push(specifier);
      return undefined;
    });
    const actual = nativeGetImportsAndExports(
      filePath,
      sourceText,
      specifier => {
        actualCalls.push(specifier);
        return undefined;
      },
      options,
      false,
      false,
      []
    );
    assert.deepEqual(actualCalls, expectedCalls, sourceText);
    assert.deepEqual(actual, expected, sourceText);
    assert.deepEqual([...actual.imports.unresolved], [...expected.imports.unresolved], sourceText);
  }
  const value = String.fromCharCode(0xd800);
  const sourceText = '/** @type {import("' + value + '").Value}\n * @import { Value } from "' + value + '" */';
  const file = nativeGetImportsAndExports(
    '/workspace/comment.ts',
    sourceText,
    () => undefined,
    options,
    false,
    false,
    []
  );
  const specifiers: string[] = [];
  for (const item of file.imports.unresolved) specifiers.push(item.specifier);
  assert.deepEqual(specifiers, wasiParser ? [] : [rawComments ? value : '�', '�']);
});

test('Fused native analyzer preserves raw comment sources and lossy synthetic imports', () => {
  const native = new NativeModuleResolver(resolverPlan());
  const host = createCustomModuleResolver({}, [], () => undefined);
  for (const sourceText of sources) {
    const filePath = '/workspace/comment.ts';
    const expected = reference(filePath, sourceText, host);
    const actual = nativeGetImportsAndExportsWithResolver(filePath, sourceText, native, options, false, false, []);
    assert.deepEqual(actual, expected, sourceText);
    assert.deepEqual([...actual.imports.unresolved], [...expected.imports.unresolved], sourceText);
  }
});

test('Native parser keeps original line positions and tag whitespace after source conversion', () => {
  const high = String.fromCharCode(0xd800);
  const cases = [
    'const marker = "' + high + '\n";\nimport "./dep"; export const value=1;',
    'const marker = 1; ' + high + '\n// @public\nexport const value=1;',
    '// @jsxImportSource ' + high + '\nimport "after";',
    '/** @import { Value } from "' + high + 'X" */',
    'import "before"; export * from "star"; import("' + high + '"); export const value=1;',
  ];
  const resolver = new NativeModuleResolver(resolverPlan());
  const host = createCustomModuleResolver({}, [], () => undefined);
  for (const filePath of ['/workspace/source.ts', '/workspace/' + high + '.ts', '/workspace/' + high + '.vue']) {
    for (const sourceText of cases) {
      const expected = reference(filePath, sourceText, host);
      const callback = nativeGetImportsAndExports(filePath, sourceText, host, options, false, false, []);
      const fused = nativeGetImportsAndExportsWithResolver(filePath, sourceText, resolver, options, false, false, []);
      assert.deepEqual(callback, expected, filePath + ': ' + sourceText);
      assert.deepEqual(fused, expected, filePath + ': ' + sourceText);
      assert.deepEqual([...callback.imports.unresolved], [...expected.imports.unresolved]);
      assert.deepEqual([...fused.imports.unresolved], [...expected.imports.unresolved]);
    }
  }
  if (wasiParser) {
    const lines = nativeGetImportsAndExports('/workspace/source.ts', cases[0], host, options, false, false, []);
    const locations: number[][] = [];
    for (const item of lines.imports.unresolved) locations.push([item.pos, item.line, item.col]);
    assert.deepEqual(locations, [[28, 3, 8]]);
    const tags = nativeGetImportsAndExports('/workspace/source.ts', cases[1], host, options, false, false, []);
    assert.deepEqual([...tags.exports.get('value')!.jsDocTags], ['@public']);
  }
});

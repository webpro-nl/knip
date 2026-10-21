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

test('Native enum members preserve raw UTF-16 spelling only in the host raw-transfer mode', () => {
  const resolver = new NativeModuleResolver(resolverPlan());
  const host = createCustomModuleResolver({}, [], () => undefined);
  const high = String.fromCharCode(0xd800);
  const values = [
    high,
    high + 'X',
    String.fromCharCode(0xdfff) + 'X',
    String.fromCharCode(0xd800, 0xd800, 0xdc00, 0xdc00),
    'é🍎�',
    '\\uD800',
    '\\u{10400}',
    '\\x41',
    '\0Sd800',
    '\0N',
    'line\\\r\ncontinued',
    '',
  ];
  for (const value of values) {
    for (const name of ['"' + value + '"', "'" + value + "'", '["' + value + '"]']) {
      const filePath = '/workspace/enum.source';
      const sourceText =
        'const prefix = "é🍎' +
        high +
        'X";\r\n/** @public */ export enum E { /** @member */ ' +
        name +
        ' = 1, Bare = 2 }';
      const expected = reference(filePath, sourceText, host);
      const actual = nativeGetImportsAndExports(filePath, sourceText, host, options, false, false, []);
      const fused = nativeGetImportsAndExportsWithResolver(filePath, sourceText, resolver, options, false, false, []);
      assert.deepEqual(actual, expected, sourceText);
      assert.deepEqual(fused, expected, sourceText);
    }
  }
  const sourceText = 'export enum E { "' + high + 'X" = 1, "\\uD800" = 2 }';
  const file = nativeGetImportsAndExports('/workspace/enum.ts', sourceText, host, options, false, false, []);
  const names: string[] = [];
  for (const member of file.exports.get('E')?.members ?? []) names.push(member.identifier);
  assert.deepEqual(names, [rawComments ? high + 'X' : wasiParser ? String.fromCodePoint(0x10058) : '�X', '\\uD800']);
});

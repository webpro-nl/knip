import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import {
  createNativeFile,
  createNativeOptions,
  nativeGetImportsAndExportsWithResolver,
} from '../../src/native-analyzer.ts';
import { NativeModuleResolver, type NativeFileRequest } from '../../src/native-module-resolver.ts';
import type { GetImportsAndExportsOptions } from '../../src/types/config.ts';
import { join } from '../../src/util/path.ts';
import { resolverPlan } from './resolver-plan.ts';

const options: GetImportsAndExportsOptions = {
  skipTypeOnly: false,
  isFixExports: true,
  isFixTypes: true,
  isReportExports: true,
  tags: [[], []],
};

test('Native batches preserve ordered complete file analysis and UTF-16 fixes', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-native-batch-')));
  try {
    writeFileSync(join(cwd, 'package.json'), '{"name":"native-batch","type":"module"}');
    const requests: NativeFileRequest[] = [];
    for (let index = 0; index < 96; index++) {
      const filePath = join(cwd, `module-${index}.ts`);
      writeFileSync(
        filePath,
        `import { value as previous } from './module-${(index + 1) % 96}.js';\n` +
          `import type { Missing } from 'missing-package';\n` +
          `const emoji = '🍎';\n/** @public */\nexport const value = [previous, emoji, ${index}];\n` +
          `export enum Fruit { Apple, Pear }\n`
      );
      requests.push({ filePath, options: createNativeOptions(options, true, false) });
    }
    const resolver = new NativeModuleResolver(resolverPlan());
    const results = resolver.analyzeFiles(requests);
    assert.equal(results.length, requests.length);
    for (let index = 0; index < requests.length; index++) {
      const request = requests[index];
      const result = results[index];
      assert.equal(result.error, undefined);
      assert.ok(result.file);
      const actual = createNativeFile(result.file);
      const expected = nativeGetImportsAndExportsWithResolver(
        request.filePath,
        readFileSync(request.filePath, 'utf8'),
        resolver,
        options,
        true,
        false
      );
      assert.deepEqual(actual, expected, request.filePath);
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Native batches isolate unreadable inputs and match replacement decoding', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-native-batch-')));
  try {
    const filePath = join(cwd, 'replacement.ts');
    writeFileSync(
      filePath,
      Buffer.concat([Buffer.from("export const value = '"), Buffer.from([0xed, 0xa0, 0x80]), Buffer.from("';")])
    );
    const nativeOptions = createNativeOptions(options, false, false);
    const resolver = new NativeModuleResolver(resolverPlan());
    const results = resolver.analyzeFiles([
      { filePath: join(cwd, 'missing.ts'), options: nativeOptions },
      { filePath, options: nativeOptions },
      { filePath: cwd, options: nativeOptions },
    ]);
    assert.equal(results.length, 3);
    assert.equal(results[0].unreadable, true);
    assert.equal(results[2].unreadable, true);
    assert.ok(results[1].file);
    assert.deepEqual(
      createNativeFile(results[1].file),
      nativeGetImportsAndExportsWithResolver(filePath, readFileSync(filePath, 'utf8'), resolver, options, false, false)
    );
    assert.deepEqual(resolver.analyzeFiles([]), []);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('Native batches return source-glob regular expressions in analysis order', () => {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), 'knip-native-batch-')));
  try {
    const filePath = join(cwd, 'contexts.js');
    const source = "require.context('./first', true, /\\.tsx$/i);\nrequire.context('./second', false, /🍎/u);";
    writeFileSync(filePath, source);
    const resolver = new NativeModuleResolver(resolverPlan());
    const [result] = resolver.analyzeFiles([
      { filePath, options: createNativeOptions(options, false, false, ['webpack']) },
    ]);
    assert.ok(result.file);
    assert.deepEqual(result.filters, [
      ['\\.tsx$', 'i'],
      ['🍎', 'u'],
    ]);
    const filters: RegExp[] = [];
    for (const [pattern, flags] of result.filters) filters.push(new RegExp(pattern, flags));
    assert.deepEqual(
      createNativeFile(result.file, filters),
      nativeGetImportsAndExportsWithResolver(filePath, source, resolver, options, false, false, ['webpack'])
    );
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

import test from 'node:test';
import assert from 'node:assert';
import { run } from '../src/index';
import { SourceFile } from 'ts-morph';

const match = (sourceFile: SourceFile, filePath: string) => sourceFile.getFilePath().endsWith(filePath);

test('run', async () => {
  const { allUnusedFiles, allUnusedExports, allUnusedTypes, allDuplicateExports } = await run({
    cwd: 'test/fixtures/basic',
    entryFiles: ['test/fixtures/basic/index.ts'],
    filePatterns: ['test/fixtures/basic/*.ts'],
    isShowProgress: false,
    isFindUnusedFiles: true,
    isFindUnusedExports: true,
    isFindUnusedTypes: true,
    isFindDuplicateExports: true,
    isIgnoreNamespaceImports: false
  });

  assert(allUnusedFiles.length === 1);
  assert(match(allUnusedFiles[0].sourceFile, 'dangling.ts'));

  assert(allUnusedExports.length === 1);
  assert(allUnusedExports[0].name === 'z');
  assert(match(allUnusedExports[0].sourceFile, 'ns.ts'));

  assert(allUnusedTypes.length === 2);
  assert(allUnusedTypes[0].name === 'type Dep');
  assert(allUnusedTypes[1].name === 'interface NS');
  assert(match(allUnusedTypes[0].sourceFile, 'dep.ts'));
  assert(match(allUnusedTypes[1].sourceFile, 'ns.ts'));

  assert(allDuplicateExports.length === 1);
  assert(allDuplicateExports[0].name === 'dep, default');
  assert(match(allDuplicateExports[0].sourceFile, 'dep.ts'));
});

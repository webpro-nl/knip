import test from 'node:test';
import assert from 'node:assert';
import { run } from '../src/index';
import { SourceFile } from 'ts-morph';

const match = (sourceFile: SourceFile, filePath: string) => filePath.endsWith(filePath);

test('run', async () => {
  const issues = await run({
    cwd: 'test/fixtures/basic',
    entryFiles: ['test/fixtures/basic/index.ts'],
    filePatterns: ['test/fixtures/basic/*.ts'],
    isShowProgress: false,
    isFindUnusedFiles: true,
    isFindUnusedExports: true,
    isFindUnusedTypes: true,
    isFindDuplicateExports: true,
    isFollowSymbols: false
  });

  assert(issues.file.length === 1);
  assert(issues.file[0].filePath.endsWith('dangling.ts'));

  assert(issues.export.length === 1);
  assert(issues.export[0].symbol === 'z');
  assert(issues.export[0].filePath.endsWith('ns.ts'));

  assert(issues.type.length === 2);
  assert(issues.type[0].symbol === 'Dep');
  assert(issues.type[0].type === 'type');
  assert(issues.type[0].filePath.endsWith('dep.ts'));
  assert(issues.type[1].symbol === 'NS');
  assert(issues.type[1].type === 'interface');
  assert(issues.type[1].filePath.endsWith('ns.ts'));

  assert(issues.duplicate.length === 1);
  assert(issues.duplicate[0].symbols[0] === 'dep');
  assert(issues.duplicate[0].symbols[1] === 'default');
  assert(issues.duplicate[0].filePath.endsWith('dep.ts'));
});

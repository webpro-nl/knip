import test from 'node:test';
import assert from 'node:assert';
import { run } from '../src/index';

test('run', async () => {
  const issues = await run({
    cwd: 'test/fixtures/basic',
    entryFiles: ['index.ts'],
    filePatterns: ['*.ts'],
    isOnlyFiles: false,
    isOnlyExports: false,
    isOnlyTypes: false,
    isOnlyDuplicates: false,
    isFindUnusedFiles: true,
    isFindUnusedExports: true,
    isFindUnusedTypes: true,
    isFindDuplicateExports: true,
    isFollowSymbols: false,
    isShowProgress: false
  });

  assert(issues.file.size === 1);

  assert(Array.from(issues.file)[0].endsWith('dangling.ts'));

  assert(Object.values(issues.export).length === 1);
  assert(issues.export['ns.ts']['z'].symbol === 'z');

  assert(Object.values(issues.type).length === 2);
  assert(issues.type['dep.ts']['Dep'].symbolType === 'type');
  assert(issues.type['ns.ts']['NS'].symbolType === 'interface');

  assert(Object.values(issues.duplicate).length === 1);
  assert(issues.duplicate['dep.ts']['dep,default'].symbols?.[0] === 'dep');
});

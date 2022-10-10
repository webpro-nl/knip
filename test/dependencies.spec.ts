import test from 'node:test';
import assert from 'node:assert';
import { run } from '../src/index';
import baseConfig from './fixtures/baseConfig';

test('run', async () => {
  const { issues, counters } = await run({
    ...baseConfig,
    workingDir: 'test/fixtures/dependencies',
    entryFiles: ['entry.ts'],
    projectFiles: ['*.ts'],
    dependencies: ['@sindresorhus/is', '@tootallnate/once', 'has'],
    devDependencies: [],
  });

  assert(Array.from(issues.files)[0].endsWith('unused.ts'));
  assert(issues.dependencies.size === 1);
  assert(issues.dependencies.has('@tootallnate/once'));

  assert(Object.keys(issues.unresolved).length === 2);
  assert(issues.unresolved['dep.ts']['ansi-regex']);
  assert(issues.unresolved['entry.ts']['not-exist']);

  assert.deepEqual(counters, {
    dependencies: 1,
    devDependencies: 0,
    duplicates: 0,
    exports: 0,
    files: 1,
    nsExports: 0,
    nsTypes: 0,
    processed: 2,
    types: 0,
    unresolved: 3,
  });
});

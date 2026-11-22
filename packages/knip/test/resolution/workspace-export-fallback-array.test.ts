import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomModuleResolver } from '../../src/typescript/resolve-module-names.ts';

test('Resolve workspace source from fallback-array package exports', () => {
  const resolveModule = createCustomModuleResolver(
    {},
    [],
    filePath =>
      filePath === '/repo/packages/library/dist/index.js' ? '/repo/packages/library/src/index.ts' : undefined,
    () => ({
      dir: '/repo/packages/library',
      target: ['./dist/index.js', './dist/fallback.js'],
    })
  );

  assert.deepEqual(resolveModule('@fixture/library', '/repo/apps/app/src/index.ts'), {
    resolvedFileName: '/repo/packages/library/src/index.ts',
    isExternalLibraryImport: false,
    packageName: undefined,
  });
});

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { main } from '../../src/index.ts';
import { clearModuleResolutionCaches, createCustomModuleResolver } from '../../src/typescript/resolve-module-names.ts';
import { join, toPosix } from '../../src/util/path.ts';
import baseCounters from '../helpers/baseCounters.ts';
import { createOptions } from '../helpers/create-options.ts';
import { resolve } from '../helpers/resolve.ts';

const cwd = resolve('fixtures/resolution/tsconfig-module-suffixes');
const moduleSuffixes = ['.ios', '.native', ''];

test('Resolve modules with tsconfig moduleSuffixes', async () => {
  const options = await createOptions({ cwd });
  const { counters } = await main(options);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 1,
    processed: 3,
    total: 3,
  });
});

function withModuleSuffixResolver(
  root: string,
  suffixes: string[],
  run: (resolveModule: ReturnType<typeof createCustomModuleResolver>, containingFile: string) => void
) {
  clearModuleResolutionCaches();
  const resolveModule = createCustomModuleResolver(
    { scopedModuleSuffixes: [{ scope: root, moduleSuffixes: suffixes }] },
    [],
    filePath => filePath
  );
  run(resolveModule, join(root, 'src', 'index.ts'));
}

test('Resolve extensionless relative import with moduleSuffixes', () => {
  const root = toPosix(mkdtempSync(join(tmpdir(), 'knip-module-suffixes-')));
  try {
    const src = join(root, 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'component.ios.ts'), 'export const x = 1;\n');
    writeFileSync(join(src, 'component.ts'), 'export const x = 2;\n');

    withModuleSuffixResolver(root, moduleSuffixes, (resolveModule, containingFile) => {
      assert.equal(resolveModule('./component', containingFile)?.resolvedFileName, join(src, 'component.ios.ts'));
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Resolve .js-suffixed relative import with moduleSuffixes', () => {
  const root = toPosix(mkdtempSync(join(tmpdir(), 'knip-module-suffixes-')));
  try {
    const src = join(root, 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'component.ios.js'), 'export const x = 1;\n');
    writeFileSync(join(src, 'component.js'), 'export const x = 2;\n');

    withModuleSuffixResolver(root, moduleSuffixes, (resolveModule, containingFile) => {
      assert.equal(resolveModule('./component.js', containingFile)?.resolvedFileName, join(src, 'component.ios.js'));
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Do not resolve default file when moduleSuffixes omit empty suffix', () => {
  const root = toPosix(mkdtempSync(join(tmpdir(), 'knip-module-suffixes-')));
  try {
    const src = join(root, 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'component.ts'), 'export const x = 2;\n');

    withModuleSuffixResolver(root, ['.ios', '.native'], (resolveModule, containingFile) => {
      assert.equal(resolveModule('./component', containingFile), undefined);
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

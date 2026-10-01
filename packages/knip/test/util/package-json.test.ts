import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPackageMapTarget,
  getPublishedTypeManifest,
  getPublishedTypeEntrySpecifiers,
  getPublishedTypeExportSpecifiers,
  isPublishedTypeExportTarget,
} from '../../src/util/package-json.ts';

test('Return a root conditional exports map', () => {
  const target = { source: './src/index.ts', default: './dist/index.js' };

  assert.deepEqual(getPackageMapTarget(target, '.'), { target });
});

test('Prefer exact and more specific package subpath matches', () => {
  const exact = { source: './src/json.ts' };
  const map = {
    './formats/*': { source: './src/*.ts' },
    './formats/special/*': { source: './src/special/*.ts' },
    './formats/json': exact,
  };

  assert.deepEqual(getPackageMapTarget(map, './formats/json'), { target: exact });
  assert.deepEqual(getPackageMapTarget(map, './formats/special/json'), {
    target: map['./formats/special/*'],
    patternMatch: 'json',
  });
  assert.equal(getPackageMapTarget(map, './missing'), undefined);
});

test('Collect only the published declaration variants', () => {
  const manifest = {
    main: './dist/index.js',
    types: './dist/index.d.ts',
    typings: './legacy/index.d.ts',
    exports: {
      '.': {
        'types@>=5.0': './types-v5/index.d.ts',
        types: './dist/index.d.ts',
        import: './dist/index.mjs',
        require: './dist/index.cjs',
      },
      './feature/*': {
        types: './dist/feature/*.d.ts',
        default: './dist/feature/*.js',
      },
      './plain': './dist/plain.js',
    },
    typesVersions: {
      '<5.0': {
        '*': ['types-v4/*'],
      },
    },
  };

  assert.deepEqual(getPublishedTypeEntrySpecifiers(manifest), {
    candidates: ['./dist/index.d.ts', './legacy/index.d.ts', 'index.d.ts'],
    versioned: new Set(['types-v4/*']),
  });
  assert.deepEqual(
    getPublishedTypeExportSpecifiers(manifest.exports),
    new Set(['./types-v5/index.d.ts', './dist/index.d.ts', './dist/feature/*.d.ts', './dist/plain.d.ts'])
  );
});

test('Apply publishConfig overrides to the published type manifest', () => {
  const publishConfig = {
    main: './dist/index.js',
    types: './dist/index.d.ts',
    typings: './dist/legacy.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
    },
    typesVersions: {
      '<5.0': {
        '*': ['types-v4/*'],
      },
    },
    private: false,
  };
  const manifest = {
    private: true,
    main: './src/index.ts',
    types: './src/index.d.ts',
    typings: './src/legacy.d.ts',
    exports: {
      '.': './src/index.ts',
    },
    typesVersions: {
      '<5.0': {
        '*': ['src/*'],
      },
    },
    publishConfig,
  };

  assert.deepEqual(getPublishedTypeManifest(manifest), {
    ...manifest,
    private: true,
    main: publishConfig.main,
    types: publishConfig.types,
    typings: publishConfig.typings,
    exports: publishConfig.exports,
    typesVersions: publishConfig.typesVersions,
  });
});

test('Fall back to an index declaration after package fields', () => {
  assert.deepEqual(getPublishedTypeEntrySpecifiers({}), {
    candidates: ['index.d.ts'],
    versioned: new Set(),
  });
});

test('Exclude declaration files behind a more specific null export', () => {
  const exports = {
    './features/*': {
      types: './dist/features/*.d.ts',
      default: './dist/features/*.js',
    },
    './features/private': null,
  };

  assert(isPublishedTypeExportTarget(exports, './dist/features/public.d.ts'));
  assert(!isPublishedTypeExportTarget(exports, './dist/features/private.d.ts'));
});

test('Apply the same export pattern match to every target wildcard', () => {
  const exports = {
    './themes/*': {
      types: './dist/*/theme-*.d.ts',
    },
  };

  assert(isPublishedTypeExportTarget(exports, './dist/dark/theme-dark.d.ts'));
  assert(!isPublishedTypeExportTarget(exports, './dist/dark/theme-light.d.ts'));
});

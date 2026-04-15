import assert from 'node:assert/strict';
import test from 'node:test';
import type { PackageJson, WorkspacePackage } from '../../src/types/package-json.ts';
import {
  matchWorkspacesByDirGlob,
  matchWorkspacesByPkgName,
  parseWorkspaceSelector,
} from '../../src/util/workspace-selectors.ts';

test('parseWorkspaceSelector: negated package name', () => {
  const selector = parseWorkspaceSelector('!@myorg/pkg', '/test/cwd');
  assert.equal(selector.type, 'pkg-name');
  assert.equal(selector.pattern, '@myorg/pkg');
  assert.equal(selector.isNegated, true);
});

test('parseWorkspaceSelector: negated directory glob', () => {
  const selector = parseWorkspaceSelector('!./apps/*', '/test/cwd');
  assert.equal(selector.type, 'dir-glob');
  assert.equal(selector.pattern, 'apps/*');
  assert.equal(selector.isNegated, true);
});

test('parseWorkspaceSelector: negated directory path', () => {
  const selector = parseWorkspaceSelector('!apps/web', '/test/cwd');
  assert.equal(selector.type, 'dir-path');
  assert.equal(selector.pattern, 'apps/web');
  assert.equal(selector.isNegated, true);
});

test('parseWorkspaceSelector: directory glob', () => {
  const selector = parseWorkspaceSelector('./apps/*', '/test/cwd');
  assert.equal(selector.type, 'dir-glob');
  assert.equal(selector.pattern, 'apps/*');
  assert.equal(selector.isNegated, false);
});

test('parseWorkspaceSelector: package name', () => {
  const selector = parseWorkspaceSelector('@myorg/pkg', '/test/cwd');
  assert.equal(selector.type, 'pkg-name');
  assert.equal(selector.pattern, '@myorg/pkg');
  assert.equal(selector.isNegated, false);
});

test('parseWorkspaceSelector: package name with glob', () => {
  const selector = parseWorkspaceSelector('@myorg/*', '/test/cwd');
  assert.equal(selector.type, 'pkg-name');
  assert.equal(selector.pattern, '@myorg/*');
  assert.equal(selector.isNegated, false);
});

test('matchWorkspacesByPkgName: exact match', () => {
  const packages = new Map<string, WorkspacePackage>([
    [
      'packages/a',
      {
        pkgName: '@test/a',
        name: 'packages/a',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
    [
      'packages/b',
      {
        pkgName: '@test/b',
        name: 'packages/b',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
  ]);

  const pkgNameToWorkspaceName = new Map<string, string>();
  for (const [workspaceName, pkg] of packages.entries()) {
    if (pkg.pkgName) pkgNameToWorkspaceName.set(pkg.pkgName, workspaceName);
  }
  const pkgNames = Array.from(pkgNameToWorkspaceName.keys());

  const result = matchWorkspacesByPkgName('@test/a', pkgNames, pkgNameToWorkspaceName);
  assert.deepEqual(result, ['packages/a']);
});

test('matchWorkspacesByPkgName: wildcard match', () => {
  const packages = new Map<string, WorkspacePackage>([
    [
      'packages/a',
      {
        pkgName: '@test/a',
        name: 'packages/a',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
    [
      'packages/b',
      {
        pkgName: '@test/b',
        name: 'packages/b',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
    [
      'apps/web',
      {
        pkgName: '@web/app',
        name: 'apps/web',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
  ]);

  const pkgNameToWorkspaceName = new Map<string, string>();
  for (const [workspaceName, pkg] of packages.entries()) {
    if (pkg.pkgName) pkgNameToWorkspaceName.set(pkg.pkgName, workspaceName);
  }
  const pkgNames = Array.from(pkgNameToWorkspaceName.keys());

  const result = matchWorkspacesByPkgName('@test/*', pkgNames, pkgNameToWorkspaceName);
  assert.deepEqual(result.sort(), ['packages/a', 'packages/b']);
});

test('matchWorkspacesByPkgName: brace expansion', () => {
  const packages = new Map<string, WorkspacePackage>([
    [
      'packages/a',
      {
        pkgName: '@test/a',
        name: 'packages/a',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
    [
      'packages/b',
      {
        pkgName: '@test/b',
        name: 'packages/b',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
    [
      'packages/c',
      {
        pkgName: '@test/c',
        name: 'packages/c',
        dir: '',
        manifestPath: '',
        manifestStr: '',
        manifest: {} as PackageJson,
      },
    ],
  ]);

  const pkgNameToWorkspaceName = new Map<string, string>();
  for (const [workspaceName, pkg] of packages.entries()) {
    if (pkg.pkgName) pkgNameToWorkspaceName.set(pkg.pkgName, workspaceName);
  }
  const pkgNames = Array.from(pkgNameToWorkspaceName.keys());

  const result = matchWorkspacesByPkgName('@test/{a,c}', pkgNames, pkgNameToWorkspaceName);
  assert.deepEqual(result.sort(), ['packages/a', 'packages/c']);
});

test('matchWorkspacesByDirGlob: wildcard', () => {
  const workspaceNames = ['packages/a', 'packages/b', 'apps/web', 'apps/api'];

  const result = matchWorkspacesByDirGlob('packages/*', workspaceNames);
  assert.deepEqual(result.sort(), ['packages/a', 'packages/b']);
});

test('matchWorkspacesByDirGlob: brace expansion', () => {
  const workspaceNames = ['packages/a', 'packages/b', 'apps/web', 'apps/api'];

  const result = matchWorkspacesByDirGlob('{packages,apps}/a*', workspaceNames);
  assert.deepEqual(result.sort(), ['apps/api', 'packages/a']);
});

import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { join } from '../../src/util/path.ts';
import mapWorkspaces from '../../src/util/map-workspaces.ts';

test('Map root workspace from package.yaml', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'knip-map-workspaces-'));
  t.after(async () => rm(cwd, { recursive: true, force: true }));

  await writeFile(
    join(cwd, 'package.yaml'),
    ['name: root-workspace', 'workspaces:', '  - packages/*', 'dependencies:', '  a.b: 1.0.0'].join('\n')
  );
  await mkdir(join(cwd, 'packages', 'one'), { recursive: true });
  await writeFile(join(cwd, 'packages', 'one', 'package.yaml'), ['name: workspace-one'].join('\n'));

  const [packages, wsPkgNames] = await mapWorkspaces(cwd, ['.', 'packages/*']);
  const rootPackage = packages.get('.');

  assert(rootPackage);
  assert.equal(rootPackage.manifestPath, join(cwd, 'package.yaml'));
  assert.equal(rootPackage.pkgName, 'root-workspace');
  assert(wsPkgNames.has('root-workspace'));
  assert(packages.has('packages/one'));
});

test('Prefer package.json over YAML in same workspace', async t => {
  const cwd = await mkdtemp(join(tmpdir(), 'knip-map-workspaces-'));
  t.after(async () => rm(cwd, { recursive: true, force: true }));

  await mkdir(join(cwd, 'packages', 'one'), { recursive: true });
  await writeFile(join(cwd, 'packages', 'one', 'package.yaml'), ['name: from-yaml'].join('\n'));
  await writeFile(join(cwd, 'packages', 'one', 'package.json'), JSON.stringify({ name: 'from-json' }, null, 2));

  const [packages] = await mapWorkspaces(cwd, ['packages/*']);
  const workspace = packages.get('packages/one');

  assert(workspace);
  assert.equal(workspace.pkgName, 'from-json');
  assert.equal(workspace.manifestPath, join(cwd, 'packages', 'one', 'package.json'));
});
